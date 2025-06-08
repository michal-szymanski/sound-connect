import { DurableObject } from 'cloudflare:workers';
import { ChatMessage, WebSocketMessage, webSocketMessageSchema } from '@sound-connect/common/types/models';
import { StoredChatMessage, UserNotificationMessage, InternalMessage } from '../types/chat';
import z from 'zod';

export class ChatDurableObject extends DurableObject {
    private storage: DurableObjectStorage;
    private roomId: string | null = null;
    private participants: Set<string> = new Set(); // User IDs of participants in this room

    constructor(
        ctx: DurableObjectState,
        public env: Cloudflare.Env
    ) {
        super(ctx, env);
        this.storage = ctx.storage;
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const userId = request.headers.get('X-User-Id');

        // Extract roomId from URL path (format: /room/{roomId}/...)
        const pathMatch = url.pathname.match(/\/room\/([^\/]+)/);
        if (pathMatch) {
            this.roomId = pathMatch[1];
        }

        if (!this.roomId) {
            return new Response('Bad Request: Missing room ID', { status: 400 });
        }

        if (!userId) {
            return new Response('Unauthorized: Missing user ID', { status: 401 });
        }

        // Load participants from storage
        await this.loadParticipants();

        if (request.method === 'GET' && url.pathname.endsWith('/history')) {
            return await this.getRoomHistoryResponse();
        }

        return new Response('Not Found', { status: 404 });
    }

    // Public methods for direct stub calls

    async subscribeUser(userId: string, roomId: string): Promise<void> {
        console.log(`[ChatDO] User ${userId} subscribing to room ${roomId}`);

        this.roomId = roomId;
        await this.loadParticipants();

        this.participants.add(userId);
        await this.saveParticipants();

        // Notify other participants that user joined
        await this.notifyParticipants(
            {
                type: 'user-joined',
                roomId: this.roomId,
                userId
            },
            userId
        );

        console.log(`[ChatDO] Room ${this.roomId} participants:`, Array.from(this.participants));
    }

    async unsubscribeUser(userId: string, roomId: string): Promise<void> {
        console.log(`[ChatDO] User ${userId} unsubscribing from room ${roomId}`);

        this.roomId = roomId;
        await this.loadParticipants();

        this.participants.delete(userId);
        await this.saveParticipants();

        // Notify other participants that user left
        await this.notifyParticipants(
            {
                type: 'user-left',
                roomId: this.roomId,
                userId
            },
            userId
        );
    }

    async sendMessage(senderId: string, roomId: string, content: string): Promise<void> {
        this.roomId = roomId;
        await this.loadParticipants();

        if (!this.participants.has(senderId)) {
            console.warn(`[ChatDO] User ${senderId} not subscribed to room ${roomId}`);
            return;
        }

        console.log(`[ChatDO] User ${senderId} sending message to room ${roomId}: "${content}"`);

        const message: StoredChatMessage = {
            type: 'chat',
            peerId: '', // Will be set based on room participants for compatibility
            text: content,
            roomId: this.roomId,
            senderId,
            timestamp: Date.now()
        };

        // Store message in room history
        await this.storeMessage(message);

        // Broadcast to all participants (including sender for echo-back)
        await this.notifyParticipants(message);
    }

    async getRoomHistory(roomId: string): Promise<StoredChatMessage[]> {
        this.roomId = roomId;
        const historyKey = 'messages';
        const history = (await this.storage.get<StoredChatMessage[]>(historyKey)) || [];
        console.log(`[ChatDO] Retrieved ${history.length} messages from room ${this.roomId}`);
        return history;
    }

    // Private helper methods

    private async loadParticipants() {
        const storedParticipants = (await this.storage.get<string[]>('participants')) || [];
        this.participants = new Set(storedParticipants);
    }

    private async saveParticipants() {
        await this.storage.put('participants', Array.from(this.participants));
    }

    private async storeMessage(message: StoredChatMessage) {
        const historyKey = 'messages';
        const history = (await this.storage.get<StoredChatMessage[]>(historyKey)) || [];
        history.push(message);

        // Keep only last 1000 messages per room
        if (history.length > 1000) {
            history.splice(0, history.length - 1000);
        }

        await this.storage.put(historyKey, history);
        console.log(`[ChatDO] Stored message in room ${this.roomId}, total messages: ${history.length}`);
    }

    private async getRoomHistoryResponse(): Promise<Response> {
        const historyKey = 'messages';
        const history = (await this.storage.get<StoredChatMessage[]>(historyKey)) || [];
        console.log(`[ChatDO] Retrieved ${history.length} messages from room ${this.roomId}`);

        return new Response(JSON.stringify(history), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    private async notifyParticipants(message: InternalMessage, excludeUserId?: string) {
        const participantList = Array.from(this.participants);
        console.log(`[ChatDO] Notifying room ${this.roomId} participants:`, participantList, 'Message:', message.type || message);

        for (const participantId of participantList) {
            if (excludeUserId && participantId === excludeUserId) {
                continue; // Skip excluded user for join/leave notifications
            }

            try {
                console.log(`[ChatDO] Sending message to participant ${participantId}`);
                const id = this.env.UserDO.idFromName(`user:${participantId}`);
                const stub = this.env.UserDO.get(id);
                await stub.sendMessage(message);
            } catch (error) {
                console.error(`[ChatDO] Error notifying participant ${participantId}:`, error);
                // Remove participant if they're unreachable
                this.participants.delete(participantId);
                await this.saveParticipants();
            }
        }
    }
}
