import { DurableObject } from 'cloudflare:workers';
import { ONLINE_STATUS_INTERVAL } from '@sound-connect/common/constants';
import {
    FollowRequestNotification,
    FollowRequestNotificationItem,
    OnlineStatusMessage,
    webSocketMessageSchema,
    ChatMessage,
    chatMessageSchema
} from '@sound-connect/common/types/models';
import z from 'zod';

// Enhanced message types for unified connection
const unifiedWebSocketMessageSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('subscribe'), roomId: z.string() }),
    z.object({ type: z.literal('unsubscribe'), roomId: z.string() }),
    z.object({ type: z.literal('message'), roomId: z.string(), content: z.string() }),
    z.object({ type: z.literal('connect') }),
    z.object({ type: z.literal('disconnect') })
]);

export class UserDurableObject extends DurableObject {
    private websocket: WebSocket | null = null;
    private storage: DurableObjectStorage;
    private subscribedRooms: Set<string> = new Set();
    private subscribers: Set<string> = new Set(); // For online status notifications
    private userId: string | null = null;
    private roomParticipants: Map<string, Set<string>> = new Map(); // roomId -> Set of userIds

    constructor(
        ctx: DurableObjectState,
        public env: Cloudflare.Env
    ) {
        super(ctx, env);
        this.storage = ctx.storage;
    }

    async fetch(request: Request): Promise<Response> {
        const upgradeHeader = request.headers.get('Upgrade');
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return new Response('Unauthorized: Missing user ID', { status: 401 });
        }

        this.userId = userId;

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
            const wsPair = new WebSocketPair();
            const [client, server] = Object.values(wsPair);

            await this.handleConnection(server);
            server.accept();

            return new Response(null, { status: 101, webSocket: client });
        }

        // Handle room history requests
        const url = new URL(request.url);
        if (request.method === 'GET' && url.pathname.includes('/history')) {
            const pathParts = url.pathname.split('/');
            const roomId = pathParts[pathParts.length - 2];
            return this.getRoomHistory(roomId);
        }

        return new Response('Not Found', { status: 404 });
    }

    async handleConnection(webSocket: WebSocket) {
        this.websocket = webSocket;

        // Load subscribed rooms from storage
        const storedRooms = await this.storage.get<string[]>('subscribedRooms');
        if (storedRooms) {
            this.subscribedRooms = new Set(storedRooms);
        }

        // Load room participants from storage
        const storedParticipants = await this.storage.get<Record<string, string[]>>('roomParticipants');
        if (storedParticipants) {
            this.roomParticipants = new Map(Object.entries(storedParticipants).map(([roomId, participants]) => [roomId, new Set(participants)]));
        }

        webSocket.addEventListener('message', async (event) => {
            try {
                const message = JSON.parse(z.string().parse(event.data));
                const parsedMessage = unifiedWebSocketMessageSchema.parse(message);

                switch (parsedMessage.type) {
                    case 'subscribe':
                        await this.subscribeToRoom(parsedMessage.roomId);
                        break;
                    case 'unsubscribe':
                        await this.unsubscribeFromRoom(parsedMessage.roomId);
                        break;
                    case 'message':
                        await this.handleChatMessage(parsedMessage.roomId, parsedMessage.content);
                        break;
                    case 'connect':
                        // Handle connection acknowledgment
                        break;
                    case 'disconnect':
                        // Handle disconnect
                        break;
                }
            } catch (error) {
                console.error(`[UserDO] Error processing message from user ${this.userId}:`, error);
            }
        });

        webSocket.addEventListener('close', () => {
            this.websocket = null;
            this.cleanup();
        });
    }

    private async subscribeToRoom(roomId: string) {
        console.log(`[UserDO] User ${this.userId} subscribing to room ${roomId}`);
        this.subscribedRooms.add(roomId);

        // Get the other participant from the roomId (assuming roomId format like "user1-user2")
        const participants = this.extractParticipantsFromRoomId(roomId);
        const otherParticipant = participants.find((id) => id !== this.userId);

        // Update local room participants
        if (!this.roomParticipants.has(roomId)) {
            this.roomParticipants.set(roomId, new Set());
        }

        // Add all participants to local cache
        participants.forEach((id) => {
            this.roomParticipants.get(roomId)!.add(id);
        });

        // Persist user's subscribed rooms
        await this.storage.put('subscribedRooms', Array.from(this.subscribedRooms));

        // If there's another participant, notify them and ask them to add us to their room
        if (otherParticipant) {
            try {
                console.log(`[UserDO] Notifying ${otherParticipant} that ${this.userId} joined room ${roomId}`);
                const otherId = this.env.UserDO.idFromName(`user:${otherParticipant}`);
                const otherStub = this.env.UserDO.get(otherId);
                await otherStub.addParticipantToRoom(roomId, this.userId!);

                // Also send user-joined message
                await otherStub.sendMessage({
                    type: 'user-joined',
                    roomId,
                    userId: this.userId!
                });
            } catch (error) {
                console.error(`[UserDO] Error notifying participant ${otherParticipant}:`, error);
            }
        }
    }

    private async unsubscribeFromRoom(roomId: string) {
        this.subscribedRooms.delete(roomId);

        // Get participants before removing from local cache
        const participants = this.roomParticipants.get(roomId);

        // Update local cache
        if (this.roomParticipants.has(roomId)) {
            this.roomParticipants.delete(roomId);
        }

        // Persist user's subscribed rooms
        await this.storage.put('subscribedRooms', Array.from(this.subscribedRooms));

        // Notify other participants in the room
        if (participants) {
            for (const participantId of participants) {
                if (participantId === this.userId) continue; // Don't send to self

                try {
                    console.log(`[UserDO] Notifying ${participantId} that ${this.userId} left room ${roomId}`);
                    const otherId = this.env.UserDO.idFromName(`user:${participantId}`);
                    const otherStub = this.env.UserDO.get(otherId);
                    await otherStub.sendMessage({
                        type: 'user-left',
                        roomId,
                        userId: this.userId!
                    });
                } catch (error) {
                    console.error(`[UserDO] Error notifying participant ${participantId}:`, error);
                }
            }
        }
    }

    private async handleChatMessage(roomId: string, content: string) {
        if (!this.subscribedRooms.has(roomId)) {
            console.warn(`[UserDO] User ${this.userId} tried to send message to unsubscribed room ${roomId}`);
            return;
        }

        console.log(`[UserDO] ${this.userId} sending message to room ${roomId}: "${content}"`);

        const message: ChatMessage & { roomId: string; senderId: string; timestamp: number } = {
            type: 'chat',
            peerId: '', // Will be set based on room participants
            text: content,
            roomId,
            senderId: this.userId!,
            timestamp: Date.now()
        };

        // Store message in room history
        await this.storeRoomMessage(roomId, message);

        // Broadcast to all participants in the room
        await this.notifyRoomParticipants(roomId, message);
    }

    async storeRoomMessage(roomId: string, message: any) {
        // Store message in the deterministic "room owner" UserDO
        const participants = this.extractParticipantsFromRoomId(roomId);
        const roomOwner = participants.sort()[0]; // First participant alphabetically

        if (roomOwner === this.userId) {
            // This UserDO is the room owner, store message locally
            const historyKey = `room:${roomId}:messages`;
            const history = (await this.storage.get<any[]>(historyKey)) || [];
            history.push(message);

            // Keep only last 1000 messages per room
            if (history.length > 1000) {
                history.splice(0, history.length - 1000);
            }

            await this.storage.put(historyKey, history);
            console.log(`[UserDO] Stored message in room ${roomId}, total messages: ${history.length}`);
        } else {
            // Forward the storage request to the room owner UserDO
            const ownerId = this.env.UserDO.idFromName(`user:${roomOwner}`);
            const ownerStub = this.env.UserDO.get(ownerId);
            await ownerStub.storeRoomMessage(roomId, message);
        }
    }

    async getRoomHistory(roomId: string): Promise<Response> {
        // Get room history from the deterministic "room owner" UserDO
        // Use the first participant (alphabetically) as the room owner for storage consistency
        const participants = this.extractParticipantsFromRoomId(roomId);
        const roomOwner = participants.sort()[0]; // First participant alphabetically

        console.log(`[UserDO] Getting room history for ${roomId}, room owner: ${roomOwner}, current user: ${this.userId}`);

        if (roomOwner === this.userId) {
            // This UserDO is the room owner, get history from local storage
            const historyKey = `room:${roomId}:messages`;
            const history = (await this.storage.get<any[]>(historyKey)) || [];
            console.log(`[UserDO] Found ${history.length} messages in room ${roomId}`);

            return new Response(JSON.stringify(history), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            // Forward the request to the room owner UserDO
            const ownerId = this.env.UserDO.idFromName(`user:${roomOwner}`);
            const ownerStub = this.env.UserDO.get(ownerId);
            return await ownerStub.getRoomHistory(roomId);
        }
    }

    private async notifyRoomParticipants(roomId: string, message: any) {
        // Get participants from local cache
        const participants = this.roomParticipants.get(roomId);
        if (!participants) {
            console.warn(`[UserDO] No participants found for room ${roomId}`);
            return;
        }

        const participantList = Array.from(participants);
        console.log(`[UserDO] Notifying room ${roomId} participants:`, participantList, 'Message:', message.type || message);

        for (const participantId of participantList) {
            try {
                console.log(`[UserDO] Sending message to participant ${participantId}`);
                const id = this.env.UserDO.idFromName(`user:${participantId}`);
                const stub = this.env.UserDO.get(id);
                await stub.sendMessage(message);
            } catch (error) {
                console.error(`[UserDO] Error notifying participant ${participantId}:`, error);
            }
        }
    }

    async sendMessage(message: any) {
        console.log(`[UserDO] Attempting to send message to user ${this.userId}:`, message);
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            console.log(`[UserDO] WebSocket is open, sending message to user ${this.userId}`);
            this.websocket.send(JSON.stringify(message));
        } else {
            console.log(`[UserDO] WebSocket not available for user ${this.userId}, state:`, this.websocket?.readyState);
        }
    }

    async addParticipantToRoom(roomId: string, participantId: string) {
        console.log(`[UserDO] Adding participant ${participantId} to room ${roomId} for user ${this.userId}`);

        if (!this.roomParticipants.has(roomId)) {
            this.roomParticipants.set(roomId, new Set());
        }

        this.roomParticipants.get(roomId)!.add(participantId);
        console.log(`[UserDO] Room ${roomId} participants for user ${this.userId}:`, Array.from(this.roomParticipants.get(roomId)!));
    }

    private extractParticipantsFromRoomId(roomId: string): string[] {
        // roomId format is like "user1:user2" (sorted alphabetically)
        // This matches the getRoomId function: [senderId, peerId].sort().join(':')
        const parts = roomId.split(':');
        console.log(`[UserDO] Extracted participants from roomId ${roomId}:`, parts);
        return parts;
    }

    private async cleanup() {
        // Clean up room participants when user disconnects
        for (const roomId of this.subscribedRooms) {
            // Notify other participants
            await this.notifyRoomParticipants(roomId, {
                type: 'user-left',
                roomId,
                userId: this.userId!
            });
        }
    }

    // Online Status Notifications
    async alarm() {
        const subscribers = Array.from(this.subscribers);

        for (const userId of subscribers) {
            const id = this.env.UserDO.idFromName(`user:${userId}`);
            const stub = this.env.UserDO.get(id);
            const success = await stub.notifyOnline(this.userId);

            if (!success) {
                this.unsubscribe([userId]);
            }
        }

        await this.storage.setAlarm(Date.now() + ONLINE_STATUS_INTERVAL);
    }

    subscribe(userIds: string[]) {
        userIds.forEach((id) => this.subscribers.add(id));
    }

    unsubscribe(userIds: string[]) {
        userIds.forEach((id) => this.subscribers.delete(id));
    }

    async notifyOnline(userId: string | null) {
        if (!userId || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            await this.storage.deleteAlarm();
            return false;
        }

        const message: OnlineStatusMessage = {
            type: 'online-status',
            userId,
            status: 'online'
        };

        this.websocket.send(JSON.stringify(message));

        return true;
    }

    // Follow Request Notifications
    async sendFollowRequestNotification(newNotification: FollowRequestNotificationItem) {
        const notifications = await this.addFollowRequestNotification(newNotification);
        await this.broadcastNotifications(notifications);
    }

    private async addFollowRequestNotification(newNotification: FollowRequestNotificationItem) {
        const notifications = [...(await this.getFollowRequestNotifications()), newNotification];
        await this.setFollowRequestNotifications(notifications);
        return notifications;
    }

    private async broadcastNotifications(notifications: FollowRequestNotificationItem[]) {
        if (!this.websocket) return;

        const message: FollowRequestNotification = {
            type: 'notification',
            kind: 'follow-request',
            items: notifications
        };

        this.websocket.send(JSON.stringify(message));
    }

    async getFollowRequestNotifications() {
        return (await this.storage.get<FollowRequestNotificationItem[]>('notifications:follow-request')) || [];
    }

    private async setFollowRequestNotifications(notifications: FollowRequestNotificationItem[]) {
        await this.storage.put('notifications:follow-request', notifications);
    }

    async removeNotification(notification: FollowRequestNotificationItem) {
        const notifications = await this.getFollowRequestNotifications();
        const filtered = notifications.filter((n) => n.id !== notification.id);
        await this.setFollowRequestNotifications(filtered);
        await this.broadcastNotifications(filtered);
    }

    async updateFollowRequestNotifications(updatedNotifications: FollowRequestNotificationItem[]) {
        const existingNotifications = await this.getFollowRequestNotifications();

        for (const updated of updatedNotifications) {
            const index = existingNotifications.findIndex((n) => n.id === updated.id);
            if (index !== -1) {
                existingNotifications[index] = updated;
            }
        }

        await this.setFollowRequestNotifications(existingNotifications);
        await this.broadcastNotifications(existingNotifications);
    }
}
