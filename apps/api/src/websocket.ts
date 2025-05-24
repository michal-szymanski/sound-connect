import { getRoomId } from '@/api/helpers';
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

    async fetch(request: Request) {
        const url = new URL(request.url);
        const upgradeHeader = request.headers.get('Upgrade');
        const userId = url.searchParams.get('userId');
        const peerId = url.searchParams.get('peerId');

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket' && userId && peerId) {
            return this.getConnection(userId, peerId);
        }

        if (request.method === 'GET' && url.pathname === '/ws/history' && userId && peerId) {
            const roomId = getRoomId(userId, peerId);
            return this.getHistory(roomId);
        }

        if (request.method === 'GET' && url.pathname === '/ws/debug') {
            return this.debug();
        }

        console.warn(`[App] Invalid request: ${request.method} ${url.pathname}`);
        return new Response('Not found', { status: 404 });
    }

    private getConnection = async (userId: string, peerId: string) => {
        const wsPair = new WebSocketPair();
        const [client, server] = Object.values(wsPair);
        this.ctx.acceptWebSocket(server);
        await this.handleConnection(server, userId, peerId);

        return new Response(null, { status: 101, webSocket: client });
    };

    private getHistory = async (roomId: string) => {
        const [userId, peerId] = roomId.split(':');

        if (!userId || !peerId) {
            throw new Error('[App] Invalid roomId');
        }

        const history = (await this.state.storage.get<Array<ChatMessage>>('messages')) || [];

        const filteredHistory = history.filter(
            (message) => (message.senderId === userId && message.receiverId === peerId) || (message.senderId === peerId && message.receiverId === userId)
        );

        return new Response(JSON.stringify(filteredHistory), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    };

    private handleConnection = async (server: WebSocket, userId: string, peerId: string) => {
        if (!userId || !peerId) {
            server.close(4001, 'Invalid user or peer ID');
            return new Response('Invalid user or peer ID', { status: 400, webSocket: server });
        }

        // Add connection to memory
        this.connections.set(userId, server);

        this.userIds.add(userId);

        // Persist userId in storage
        await this.state.storage.put(userId, true);

        // WebSocket event listeners
        server.addEventListener('message', async (event: MessageEvent<string>) => {
            try {
                const message = event.data;
                const history = (await this.state.storage.get<Array<ChatMessage>>('messages')) || [];

                const parsedMessage = chatMessageSchema.parse(JSON.parse(message));
                history.push(parsedMessage);
                await this.state.storage.put('messages', history);
                this.broadcastMessage(message, userId);
            } catch (error) {
                console.error(`[App] Error broadcasting message from user ${userId}:`, error);
            }
        });

        server.addEventListener('close', async () => {
            await this.cleanup(userId);
        });

        server.addEventListener('error', (e: Event) => {
            console.error(`[App] WebSocket error for user ${userId}:`, e);
            this.cleanup(userId);
        });
    };

    private broadcastMessage = (message: string, senderId: string) => {
        for (const [userId, connection] of this.connections) {
            if (userId !== senderId) {
                try {
                    connection.send(message);
                } catch (error) {
                    console.error(`[App] Error sending message to user ${userId}:`, error);
                    this.cleanup(userId);
                }
            }
        }
    };

    private cleanup = async (userId: string) => {
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
    };

    async debug() {
        const storedData = await this.state.storage.list();
        return new Response(JSON.stringify(storedData), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
