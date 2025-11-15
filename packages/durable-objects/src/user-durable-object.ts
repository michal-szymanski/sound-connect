import { DurableObject } from 'cloudflare:workers';
import { WebSocketMessage, webSocketMessageSchema } from '@sound-connect/common/types/models';
import { ChatService } from './services/chat-service';
import z from 'zod';

export class UserDurableObject extends DurableObject {
    private websocket: WebSocket | null = null;
    private storage: DurableObjectStorage;
    private userId: string | null = null;
    private chatService: ChatService;

    constructor(
        ctx: DurableObjectState,
        public override env: Cloudflare.Env
    ) {
        super(ctx, env);
        this.storage = ctx.storage;
        this.chatService = new ChatService(this.storage, this.env, this.userId);
    }

    override async fetch(request: Request): Promise<Response> {
        const upgradeHeader = request.headers.get('Upgrade');
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return new Response('Unauthorized: Missing user ID', { status: 401 });
        }

        this.userId = userId;
        this.chatService.updateUserId(userId);

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
            const wsPair = new WebSocketPair();
            const client = wsPair[0];
            const server = wsPair[1];

            await this.handleConnection(server);
            await this.chatService.initializeRooms();

            const responseHeaders = new Headers();
            const protocol = request.headers.get('sec-websocket-protocol');
            if (protocol) {
                const protocols = protocol.split(',').map((p) => p.trim());
                const selectedProtocol = protocols[0];
                if (selectedProtocol) {
                    responseHeaders.set('Sec-WebSocket-Protocol', selectedProtocol);
                }
            }

            return new Response(null, {
                status: 101,
                webSocket: client,
                headers: responseHeaders
            });
        }

        return new Response('Not Found', { status: 404 });
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

    async sendMessage(message: WebSocketMessage) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        }
    }

    async clearChatRooms() {
        await this.storage.delete('chat-rooms');
        return true;
    }

    async resetUserState() {
        await this.storage.delete('chat-rooms');
        return true;
    }

    private async handleConnection(webSocket: WebSocket) {
        webSocket.accept();
        this.websocket = webSocket;

        webSocket.addEventListener('message', async (event) => {
            const rawData = z.string().parse(event.data);
            const message = JSON.parse(rawData);

            const parsedMessage = webSocketMessageSchema.parse(message);

            switch (parsedMessage.type) {
                case 'subscribe':
                    await this.chatService.subscribeToRoom(parsedMessage);
                    break;
                case 'unsubscribe':
                    await this.chatService.unsubscribeFromRoom(parsedMessage);
                    break;
                case 'chat':
                    await this.chatService.handleChatMessage(parsedMessage);
                    break;
            }
        });

        webSocket.addEventListener('close', () => {
            this.websocket = null;
            this.chatService.cleanup();
        });
    }
}
