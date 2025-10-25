import { NewChatMessage, SubscribeMessage, UnsubscribeMessage } from '@/common/types/models';

const CHAT_ROOMS_KEY = 'chat-rooms';

export class ChatService {
    private subscribedRooms: Set<string> = new Set();

    constructor(
        private storage: DurableObjectStorage,
        private env: Cloudflare.Env,
        private userId: string | null
    ) {}

    async getRooms() {
        return await this.storage.get<string[]>(CHAT_ROOMS_KEY);
    }

    async setRooms(rooms: string[]) {
        await this.storage.put(CHAT_ROOMS_KEY, rooms);
    }

    async initializeRooms() {
        const storedRooms = await this.getRooms();

        if (storedRooms) {
            this.subscribedRooms = new Set(storedRooms);
        }
    }

    updateUserId(userId: string | null) {
        this.userId = userId;
    }

    async subscribeToRoom({ roomId }: SubscribeMessage) {
        if (!this.userId) return;

        this.subscribedRooms.add(roomId);
        await this.setRooms(Array.from(this.subscribedRooms));

        const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
        const chatStub = this.env.ChatDO.get(chatId);

        await chatStub.subscribeUser(this.userId, roomId);
    }

    async unsubscribeFromRoom({ roomId }: UnsubscribeMessage) {
        if (!this.userId) return;

        this.subscribedRooms.delete(roomId);
        await this.setRooms(Array.from(this.subscribedRooms));

        const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
        const chatStub = this.env.ChatDO.get(chatId);

        await chatStub.unsubscribeUser(this.userId, roomId);
    }

    async handleChatMessage({ roomId, content }: NewChatMessage) {
        if (!this.subscribedRooms.has(roomId) || !this.userId) {
            return;
        }

        const senderId = this.userId;
        const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
        const chatStub = this.env.ChatDO.get(chatId);

        await chatStub.sendMessage(senderId, roomId, content);
    }

    async cleanup() {
        for (const roomId of this.subscribedRooms) {
            await this.unsubscribeFromRoom({ type: 'unsubscribe', roomId });
        }
    }
}
