import { DurableObject } from 'cloudflare:workers';
import { ChatMessage, chatMessageSchema } from '@sound-connect/common/types/models';
import z from 'zod';

export class ChatDurableObject extends DurableObject {
    private connections: Map<string, WebSocket> = new Map();
    private userIds: Set<string> = new Set();

    constructor(
        private state: DurableObjectState,
        public env: Cloudflare.Env
    ) {
        super(state, env);
        this.state = state;
    }

    async handleConnection(webSocket: WebSocket, userId: string) {
        // Validate userId (add your authentication logic here)
        if (!userId) {
            webSocket.close(4001, 'Invalid user ID');
            return;
        }

        // Add connection to memory
        this.connections.set(userId, webSocket);
        this.userIds.add(userId);

        // Persist userId in storage
        await this.state.storage.put(userId, true);

        // WebSocket event listeners
        webSocket.addEventListener('message', async (event: MessageEvent) => {
            try {
                const message = z.string().parse(event.data);
                const history = (await this.state.storage.get<Array<ChatMessage>>('messages')) || [];
                const parsedMessage = chatMessageSchema.parse(JSON.parse(message));
                history.push(parsedMessage);
                await this.state.storage.put('messages', history);

                this.broadcastMessage(message, userId);
            } catch (error) {
                console.error(`[DO] Error broadcasting message from user ${userId}:`, error);
            }
        });

        webSocket.addEventListener('close', async () => {
            await this.cleanup(userId);
        });

        webSocket.addEventListener('error', (event: Event) => {
            console.error(`[DO] WebSocket error for user ${userId}:`, event);
            this.cleanup(userId);
        });
    }

    private broadcastMessage(message: string, senderId: string) {
        for (const [userId, connection] of this.connections) {
            if (userId !== senderId) {
                try {
                    connection.send(message);
                } catch (error) {
                    console.error(`[DO] Error sending message to user ${userId}:`, error);
                    this.cleanup(userId);
                }
            }
        }
    }

    private async cleanup(userId: string) {
        this.connections.delete(userId);
        this.userIds.delete(userId);

        // Remove userId from storage
        await this.state.storage.delete(userId);

        if (this.userIds.size === 0) {
            // Only delete user connection keys, not 'messages'
            const keys = await this.state.storage.list();
            for (const key of keys.keys()) {
                if (key !== 'messages') {
                    await this.state.storage.delete(key);
                }
            }
        }
    }

    async fetch(request: Request) {
        const url = new URL(request.url);
        const upgradeHeader = request.headers.get('Upgrade');
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return new Response('Unauthorized: Missing user ID', { status: 401 });
        }

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
            const wsPair = new WebSocketPair();
            const [client, server] = Object.values(wsPair);
            await this.handleConnection(server, userId);
            server.accept();

            return new Response(null, { status: 101, webSocket: client });
        }

        if (request.method === 'GET' && url.pathname.match(/^\/ws\/chat\/[^/]+\/history$/)) {
            const history = (await this.state.storage.get<Array<ChatMessage>>('messages')) || [];

            return new Response(JSON.stringify(history), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        return new Response('Not found', { status: 404 });
    }
}
