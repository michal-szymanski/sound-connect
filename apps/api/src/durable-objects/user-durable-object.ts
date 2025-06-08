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
import { InternalMessage } from '../types/chat';
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
        this.subscribedRooms.add(roomId);

        // Persist user's subscribed rooms
        await this.storage.put('subscribedRooms', Array.from(this.subscribedRooms));

        // Delegate to ChatDurableObject for room subscription
        try {
            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            await chatStub.subscribeUser(this.userId!, roomId);
        } catch (error) {
            console.error(`[UserDO] Error subscribing to room ${roomId}:`, error);
        }
    }

    private async unsubscribeFromRoom(roomId: string) {
        this.subscribedRooms.delete(roomId);

        // Persist user's subscribed rooms
        await this.storage.put('subscribedRooms', Array.from(this.subscribedRooms));

        // Delegate to ChatDurableObject for room unsubscription
        try {
            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            await chatStub.unsubscribeUser(this.userId!, roomId);
        } catch (error) {
            console.error(`[UserDO] Error unsubscribing from room ${roomId}:`, error);
        }
    }

    private async handleChatMessage(roomId: string, content: string) {
        if (!this.subscribedRooms.has(roomId)) {
            return;
        }

        // Delegate to ChatDurableObject for message handling
        try {
            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            await chatStub.sendMessage(this.userId!, roomId, content);
        } catch (error) {
            console.error(`[UserDO] Error sending message to room ${roomId}:`, error);
        }
    }

    async getRoomHistory(roomId: string): Promise<Response> {
        // Delegate to ChatDurableObject for room history
        try {
            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            const history = await chatStub.getRoomHistory(roomId);

            return new Response(JSON.stringify(history), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error(`[UserDO] Error getting room history for ${roomId}:`, error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }

    async sendMessage(message: InternalMessage) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        }
    }

    private extractParticipantsFromRoomId(roomId: string): string[] {
        // roomId format is like "user1:user2" (sorted alphabetically)
        // This matches the getRoomId function: [senderId, peerId].sort().join(':')
        const parts = roomId.split(':');
        return parts;
    }

    private async cleanup() {
        // Clean up room participants when user disconnects
        for (const roomId of this.subscribedRooms) {
            // Unsubscribe from rooms through ChatDO
            await this.unsubscribeFromRoom(roomId);
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
