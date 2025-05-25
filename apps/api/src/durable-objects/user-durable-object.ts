import { DurableObject } from 'cloudflare:workers';

export class UserDurableObject extends DurableObject {
    private connections: Set<WebSocket> = new Set(); // Set of WebSocket connections to the owner
    private subscriptions: Map<string, string> = new Map(); // Map of subscribed user IDs to their statuses
    private subscribers: Set<string> = new Set(); // Set of user IDs who are subscribed to this user

    constructor(
        private state: DurableObjectState,
        public env: any
    ) {
        super(state, env);
    }

    async fetch(request: Request): Promise<Response> {
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

        return new Response('Not Found', { status: 404 });
    }

    async handleConnection(webSocket: WebSocket, userId: string) {
        webSocket.accept();
        this.connections.add(webSocket);

        console.log(`[DO] WebSocket connection added. Total connections: ${this.connections.size}`);

        webSocket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'change-status') {
                const { status } = data;
                this.subscriptions.set(userId, status);
                console.log(`[DO] Updated status for user ${userId}: ${status}`);
                this.sendStatusUpdate();
                return new Response('Status updated', { status: 200 });
            }

            if (data.type === 'subscribe') {
                console.log(`[DO] Handling subscribe`);
                const { userIds } = data;
                this.handleSubscribe(userIds);
                return new Response('Subscribed', { status: 200 });
            }

            if (data.type === 'unsubscribe') {
                const { userIds } = data;
                this.handleUnsubscribe(userIds);
                return new Response('Unsubscribed', { status: 200 });
            }

            console.error('[DO] Error: unhandled message', event);
        });

        webSocket.addEventListener('close', () => {
            console.log(`[DO] WebSocket closed`);
            this.connections.delete(webSocket);
            console.log(`[DO] WebSocket connection removed. Total connections: ${this.connections.size}`);
        });

        webSocket.addEventListener('error', (event) => {
            console.error('[DO] WebSocket error:', event);
            this.connections.delete(webSocket);
            console.log(`[DO] WebSocket connection removed due to error. Total connections: ${this.connections.size}`);
        });

        this.sendStatusUpdate();
    }

    handleSubscribe(userIds: string[]) {
        console.log(`[DO] Attempt to subscribe to users: ${userIds.join(', ')}`);
        userIds.forEach((userId) => {
            if (!this.subscriptions.has(userId)) {
                this.subscriptions.set(userId, 'offline'); // Default status
            }
        });
        console.log(`[DO] Subscribed to users: ${userIds.join(', ')}`);
        console.log(`[DO] Current subscriptions:`, Array.from(this.subscriptions.entries()));
        this.sendStatusUpdate();
    }

    handleUnsubscribe(userIds: string[]) {
        userIds.forEach(async (userId) => {
            this.subscriptions.delete(userId);

            // Notify the unsubscribed user's Durable Object
            const id = this.env.UserDO.idFromName(`user:${userId}`);
            const stub = this.env.UserDO.get(id);

            await stub.fetch(
                new Request('http://localhost/unsubscribe', {
                    method: 'POST',
                    body: JSON.stringify({ subscriberId: this.state.id.toString() }),
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        });
        console.log(`[DO] Unsubscribed from users: ${userIds.join(', ')}`);
        this.sendStatusUpdate();
    }

    handleStatusUpdate(newStatus: string) {
        // Update the owner's status
        const statusMessage = JSON.stringify({
            type: 'statusUpdate',
            status: newStatus
        });

        console.log(`[DO] Broadcasting status update:`, statusMessage);

        for (const connection of this.connections) {
            try {
                connection.send(statusMessage);
            } catch (error) {
                console.error('[DO] Error sending status update:', error);
                this.connections.delete(connection);
            }
        }

        // Notify all subscribers about the status change
        this.notifySubscribers(newStatus);
    }

    async notifySubscribers(newStatus: string) {
        for (const subscriberId of this.subscribers) {
            const id = this.env.UserDO.idFromName(`user:${subscriberId}`);
            const stub = this.env.UserDO.get(id);

            console.log(`[DO] Notifying subscriber ${subscriberId} about status change: ${newStatus}`);
            await stub.fetch(
                new Request('http://localhost/update-status', {
                    method: 'POST',
                    body: JSON.stringify({ userId: this.state.id.toString(), status: newStatus }),
                    headers: { 'Content-Type': 'application/json' }
                })
            );
        }
    }

    sendStatusUpdate() {
        const statusMessage = JSON.stringify({
            type: 'statusUpdate',
            subscriptions: Array.from(this.subscriptions.entries()) // Convert Map to array of [userId, status]
        });

        console.log(`[DO] Sending status update:`, statusMessage);

        for (const connection of this.connections) {
            try {
                console.log(`[DO] Sending status update to connection`);
                connection.send(statusMessage);
            } catch (error) {
                console.error('[DO] Error sending status update:', error);
                this.connections.delete(connection);
                console.log(`[DO] WebSocket connection removed due to error. Total connections: ${this.connections.size}`);
            }
        }
    }
}
