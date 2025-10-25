import { ChatMessage, chatMessageSchema, WebSocketMessage } from '@/common/types/models';
import { DurableObject } from 'cloudflare:workers';

const MESSAGES_KEY = 'messages';
const PARTICIPANTS_KEY = 'participants';

export class ChatDurableObject extends DurableObject {
    private storage: DurableObjectStorage;
    private roomId: string | null = null;
    private participants: Set<string> = new Set();

    constructor(
        ctx: DurableObjectState,
        public override env: Cloudflare.Env
    ) {
        super(ctx, env);
        this.storage = ctx.storage;
    }

    async subscribeUser(userId: string, roomId: string): Promise<void> {
        this.roomId = roomId;
        await this.loadParticipants();

        this.participants.add(userId);
        await this.saveParticipants();

        await this.broadcastMessage(
            {
                type: 'user-joined',
                roomId: this.roomId,
                userId
            },
            userId
        );
    }

    async unsubscribeUser(userId: string, roomId: string): Promise<void> {
        this.roomId = roomId;
        await this.loadParticipants();

        this.participants.delete(userId);
        await this.saveParticipants();

        await this.broadcastMessage(
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
            return;
        }

        const message = chatMessageSchema.parse({
            id: crypto.randomUUID(),
            type: 'chat',
            content,
            roomId: this.roomId,
            senderId,
            timestamp: Date.now()
        });

        await this.storeMessage(message);
        await this.broadcastMessage(message);
    }

    async getRoomHistory(roomId: string): Promise<ChatMessage[]> {
        this.roomId = roomId;

        const history = (await this.storage.get<ChatMessage[]>(MESSAGES_KEY)) || [];

        return history;
    }

    private async loadParticipants() {
        const storedParticipants = (await this.storage.get<string[]>(PARTICIPANTS_KEY)) || [];
        this.participants = new Set(storedParticipants);
    }

    private async saveParticipants() {
        await this.storage.put(PARTICIPANTS_KEY, Array.from(this.participants));
    }

    private async storeMessage(message: ChatMessage) {
        const history = (await this.storage.get<ChatMessage[]>(MESSAGES_KEY)) || [];
        history.push(message);

        if (history.length > 1000) {
            history.splice(0, history.length - 1000);
        }

        await this.storage.put(MESSAGES_KEY, history);
    }

    private async broadcastMessage(message: WebSocketMessage, excludeUserId?: string) {
        const participantList = Array.from(this.participants);

        for (const participantId of participantList) {
            if (excludeUserId && participantId === excludeUserId) {
                continue;
            }

            try {
                const id = this.env.UserDO.idFromName(`user:${participantId}`);
                const stub = this.env.UserDO.get(id);
                await stub.sendMessage(message);
            } catch (_error) {
                this.participants.delete(participantId);
                await this.saveParticipants();
            }
        }
    }

    async getStorageForDebug() {
        try {
            const list = await this.storage.list();

            const storage = Array.from(list.entries()).map(([key, value]) => ({
                [key]: value
            }));

            return storage;
        } catch (error) {
            throw new Error(`Failed to retrieve storage data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
