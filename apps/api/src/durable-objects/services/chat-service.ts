import { NewChatMessage, SubscribeMessage, UnsubscribeMessage } from '@sound-connect/common/types/models';

export class ChatService {
    private subscribedRooms: Set<string> = new Set();

    constructor(
        private storage: DurableObjectStorage,
        private env: Cloudflare.Env,
        private userId: string | null
    ) {}

    async initializeRooms() {
        const storedRooms = await this.storage.get<string[]>('subscribed-rooms');
        if (storedRooms) {
            this.subscribedRooms = new Set(storedRooms);
        }
    }

    updateUserId(userId: string | null) {
        this.userId = userId;
    }

    async subscribeToRoom({ roomId }: SubscribeMessage) {
        this.subscribedRooms.add(roomId);

        await this.storage.put('subscribed-rooms', Array.from(this.subscribedRooms));

        try {
            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            await chatStub.subscribeUser(this.userId!, roomId);
        } catch (error) {
            console.error(`[ChatService] Error subscribing to room ${roomId}:`, error);
        }
    }

    async unsubscribeFromRoom({ roomId }: UnsubscribeMessage) {
        this.subscribedRooms.delete(roomId);

        await this.storage.put('subscribed-rooms', Array.from(this.subscribedRooms));

        try {
            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            await chatStub.unsubscribeUser(this.userId!, roomId);
        } catch (error) {
            console.error(`[ChatService] Error unsubscribing from room ${roomId}:`, error);
        }
    }

    async handleChatMessage({ roomId, content }: NewChatMessage) {
        if (!this.subscribedRooms.has(roomId) || !this.userId) {
            return;
        }

        try {
            const senderId = this.userId;

            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            await chatStub.sendMessage(senderId, roomId, content);
        } catch (error) {
            console.error(`[ChatService] Error sending message to room ${roomId}:`, error);
        }
    }

    async getRoomHistory(roomId: string): Promise<Response> {
        try {
            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            const history = await chatStub.getRoomHistory(roomId);

            return new Response(JSON.stringify(history), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error(`[ChatService] Error getting room history for ${roomId}:`, error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }

    async cleanup() {
        for (const roomId of this.subscribedRooms) {
            await this.unsubscribeFromRoom({ type: 'unsubscribe', roomId });
        }
    }
}
