import { DurableObject } from 'cloudflare:workers';

export class UserStatusesDurableObject extends DurableObject {
    private connections: Map<WebSocket, Set<string>> = new Map(); // Map of WebSocket connections to subscribed user IDs
    private userStatuses: Map<string, string> = new Map(); // Map of user IDs to their statuses (e.g., "online", "offline", "idle")

    async fetch(request: Request): Promise<Response> {
        const upgradeHeader = request.headers.get('Upgrade');

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
            const wsPair = new WebSocketPair();
            const [client, server] = Object.values(wsPair);
            await this.handleConnection(server);
            server.accept();

            return new Response(null, { status: 101, webSocket: client });
        }

        return new Response('WebSocket Upgrade Required', { status: 426 });
    }

    async handleConnection(webSocket: WebSocket) {
        this.connections.set(webSocket, new Set());

        webSocket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'subscribe') {
                // Update the subscription list for this connection
                const userIds = message.userIds || [];
                this.connections.set(webSocket, new Set(userIds));
                console.log(`[DO] Subscribed to user statuses: ${userIds.join(', ')}`);
                console.log(`[DO] Current connections:`, this.connections);
            } else if (message.type === 'changeStatus') {
                // Handle status change
                const { userId, status } = message;
                this.updateUserStatus(userId, status);
            }
        });

        webSocket.addEventListener('close', () => {
            console.log(`[DO] WebSocket closed`);
            this.connections.delete(webSocket);
        });

        webSocket.addEventListener('error', (event) => {
            console.error('[DO] WebSocket error:', event);
            this.connections.delete(webSocket);
        });
    }

    async updateUserStatus(userId: string, status: string) {
        this.userStatuses.set(userId, status);

        const statusMessage = JSON.stringify({
            type: 'statusUpdate',
            userId,
            status
        });

        console.log(`[DO] Broadcasting status update:`, statusMessage);

        for (const [connection, subscribedUsers] of this.connections) {
            console.log(`[DO] Checking connection for userId: ${userId}`);
            if (subscribedUsers.has(userId)) {
                try {
                    console.log(`[DO] Sending status update to connection`);
                    connection.send(statusMessage);
                } catch (error) {
                    console.error('[DO] Error sending status update:', error);
                    this.connections.delete(connection);
                }
            }
        }
    }
}
