import { DurableObject } from 'cloudflare:workers';
import { ChatMessage, chatMessageSchema } from '@sound-connect/common/types/models';
import z from 'zod';

export class ChatDurableObject extends DurableObject {
    private connections: Map<string, WebSocket> = new Map(); // Active WebSocket connections
    private participants: Set<string> = new Set(); // User IDs of participants

    constructor(
        private state: DurableObjectState,
        public env: Cloudflare.Env
    ) {
        super(state, env);
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const upgradeHeader = request.headers.get('Upgrade');
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return new Response('Unauthorized: Missing user ID', { status: 401 });
        }

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
            // Handle WebSocket connection
            const wsPair = new WebSocketPair();
            const [client, server] = Object.values(wsPair);
            await this.handleConnection(server, userId);
            server.accept();

            return new Response(null, { status: 101, webSocket: client });
        }

        if (request.method === 'GET' && url.pathname.endsWith('/history')) {
            // Fetch message history
            const history = (await this.state.storage.get<Array<ChatMessage>>('messages')) || [];
            return new Response(JSON.stringify(history), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (request.method === 'POST') {
            // Handle incoming messages
            const json = await request.json();
            const { senderId, content } = z.object({ senderId: z.string(), content: z.string() }).parse(json);
            await this.storeAndBroadcastMessage(senderId, content);
            return new Response('Message sent', { status: 200 });
        }

        return new Response('Not Found', { status: 404 });
    }

    async handleConnection(webSocket: WebSocket, userId: string) {
        // Add the user to the active connections
        this.connections.set(userId, webSocket);
        this.participants.add(userId);

        // Persist the participant in storage
        await this.state.storage.put(userId, true);

        // WebSocket event listeners
        webSocket.addEventListener('message', async (event: MessageEvent) => {
            try {
                const message = JSON.parse(z.string().parse(event.data));
                if (message.type === 'message') {
                    const { content } = message;
                    await this.storeAndBroadcastMessage(userId, content);
                }
            } catch (error) {
                console.error(`[ChatDO] Error processing message from user ${userId}:`, error);
            }
        });

        webSocket.addEventListener('close', async () => {
            await this.cleanup(userId);
        });

        webSocket.addEventListener('error', (event: Event) => {
            console.error(`[ChatDO] WebSocket error for user ${userId}:`, event);
            this.cleanup(userId);
        });
    }

    private async storeAndBroadcastMessage(senderId: string, content: string) {
        // Create a message object
        const message: ChatMessage = {
            type: 'chat',
            peerId: senderId,
            text: content,
            senderId,
            timestamp: Date.now()
        };

        // Store the message in Durable Object storage
        const history = (await this.state.storage.get<Array<ChatMessage>>('messages')) || [];
        history.push(message);
        await this.state.storage.put('messages', history);

        // Broadcast the message to all participants
        this.broadcastMessage(message, senderId);
    }

    private broadcastMessage(message: ChatMessage, senderId: string) {
        for (const [userId, connection] of this.connections) {
            if (userId !== senderId) {
                try {
                    connection.send(JSON.stringify(message));
                } catch (error) {
                    console.error(`[ChatDO] Error sending message to user ${userId}:`, error);
                    this.cleanup(userId);
                }
            }
        }
    }

    private async cleanup(userId: string) {
        this.connections.delete(userId);
        this.participants.delete(userId);

        // Remove the user from storage
        await this.state.storage.delete(userId);

        if (this.participants.size === 0) {
            // Clean up storage if no participants remain
            const keys = await this.state.storage.list();
            for (const key of keys.keys()) {
                if (key !== 'messages') {
                    await this.state.storage.delete(key);
                }
            }
        }
    }
}
