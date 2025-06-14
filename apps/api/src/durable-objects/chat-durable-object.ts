import { ChatMessage, chatMessageSchema, WebSocketMessage } from '@sound-connect/common/types/models';
import { DurableObject } from 'cloudflare:workers';

export class ChatDurableObject extends DurableObject {
    private storage: DurableObjectStorage;
    private roomId: string | null = null;
    private participants: Set<string> = new Set();

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

        await this.loadParticipants();

        if (request.method === 'GET' && url.pathname.endsWith('/history')) {
            return await this.getRoomHistoryResponse();
        }

        return new Response('Not Found', { status: 404 });
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
        const historyKey = 'messages';

        const history = (await this.storage.get<ChatMessage[]>(historyKey)) || [];

        return history;
    }

    private async loadParticipants() {
        const storedParticipants = (await this.storage.get<string[]>('participants')) || [];
        this.participants = new Set(storedParticipants);
    }

    private async saveParticipants() {
        await this.storage.put('participants', Array.from(this.participants));
    }

    private async storeMessage(message: ChatMessage) {
        const historyKey = 'messages';
        const history = (await this.storage.get<ChatMessage[]>(historyKey)) || [];
        history.push(message);

        if (history.length > 1000) {
            history.splice(0, history.length - 1000);
        }

        await this.storage.put(historyKey, history);
    }

    private async getRoomHistoryResponse(): Promise<Response> {
        const historyKey = 'messages';
        const history = (await this.storage.get<ChatMessage[]>(historyKey)) || [];

        return new Response(JSON.stringify(history), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
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
            } catch (error) {
                console.error(`[ChatDO] Error notifying participant ${participantId}:`, error);
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
            console.error(`[ChatDO] Error getting storage debug for room ${this.roomId}:`, error);
            throw new Error(`Failed to retrieve storage data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
