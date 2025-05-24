import { DurableObject } from 'cloudflare:workers';
import { ChatMessage, chatMessageSchema } from 'types';

export class WebSocketServer extends DurableObject {
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
        webSocket.addEventListener('message', async (event: MessageEvent<string>) => {
            try {
                const message = event.data;
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
        const userId = url.searchParams.get('userId');

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket' && userId) {
            const wsPair = new WebSocketPair();

            const client = wsPair[0];
            const server = wsPair[1];
            await this.handleConnection(server, userId);
            server.accept(); // <-- Accept the server WebSocket so it receives events

            return new Response(null, { status: 101, webSocket: client });
        }
        // HTTP GET /history: return chat history
        if (request.method === 'GET' && url.pathname.match(/^\/ws\/[\w:]+\/history$/)) {
            const history = (await this.state.storage.get<Array<any>>('messages')) || [];

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
