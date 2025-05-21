import { DurableObject } from 'cloudflare:workers';

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
        webSocket.addEventListener('message', (event: MessageEvent) => {
            try {
                this.broadcastMessage(event.data, userId);
            } catch (error) {
                console.error(`Error broadcasting message from user ${userId}:`, error);
            }
        });

        webSocket.addEventListener('close', async () => {
            await this.cleanup(userId);
        });

        webSocket.addEventListener('error', (event: Event) => {
            console.error(`WebSocket error for user ${userId}:`, event);
            this.cleanup(userId);
        });
    }

    private broadcastMessage(message: string, senderId: string) {
        for (const [userId, connection] of this.connections) {
            if (userId !== senderId) {
                try {
                    connection.send(JSON.stringify({ senderId, message }));
                } catch (error) {
                    console.error(`Error sending message to user ${userId}:`, error);
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
            // Cleanup the Durable Object instance if no users are left
            const keys = await this.state.storage.list();
            for (const key of keys.keys()) {
                await this.state.storage.delete(key);
            }
        }
    }
}
