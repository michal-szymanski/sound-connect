import { DurableObject } from 'cloudflare:workers';

export class UserDurableObject extends DurableObject {
    private websocket: WebSocket | null = null;
    private subscriptions: Map<
        string,
        {
            status: string;
            webSocket: WebSocket;
        }
    > = new Map(); // Map of subscribed user IDs to their statuses

    constructor(
        private state: DurableObjectState,
        public env: Cloudflare.Env
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

    private getUserStatuses = () => {
        return Array.from(this.subscriptions.entries(), ([userId, { status }]) => ({ userId, status }));
    };

    private getConnections = () => {
        return Array.from(this.subscriptions.entries(), ([_userId, { webSocket: websocket }]) => websocket);
    };

    async handleConnection(webSocket: WebSocket, userId: string) {
        webSocket.accept();
        this.websocket = webSocket;

        //console.log(`[DO] WebSocket connection added. Total connections: ${this.connections.size}`);

        webSocket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            console.log(`[DO] Event: ${data.type}`);
            if (data.type === 'change-status') {
                const { status } = data;
                this.subscriptions.set(userId, {
                    status,
                    webSocket
                });
                console.log(`[DO] Updated status for user ${userId}: ${status}`);
                this.sendStatusUpdate();
                return new Response('Status updated', { status: 200 });
            }

            if (data.type === 'subscribe') {
                console.log(`[DO] Handling subscribe`);
                const { userIds } = data;
                this.handleSubscribe(userIds, userId);
                return new Response('Subscribed', { status: 200 });
            }

            if (data.type === 'unsubscribe') {
                const { userIds } = data;
                this.handleUnsubscribe(userIds);
                return new Response('Unsubscribed', { status: 200 });
            }

            if (data.type === 'status-update') return;

            console.error('[DO] Error: unhandled message', event);
        });

        webSocket.addEventListener('close', () => {
            console.log(`[DO] WebSocket closed`);
            //this.connections.delete(webSocket);
            this.websocket = null;
            //console.log(`[DO] WebSocket connection removed. Total connections: ${this.connections.size}`);
        });

        webSocket.addEventListener('error', (event) => {
            console.error('[DO] WebSocket error:', event);
            //this.connections.delete(webSocket);
            this.websocket = null;
            //console.log(`[DO] WebSocket connection removed due to error. Total connections: ${this.connections.size}`);
        });

        this.sendStatusUpdate();
    }

    handleSubscribe(userIds: string[], currentUserId: string) {
        console.log(`[DO] Attempt to subscribe to users: ${userIds.join(', ')}`);
        userIds.forEach(async (userId) => {
            if (!this.subscriptions.has(userId)) {
                const id = this.env.UserDO.idFromName(`user:${userId}`);
                const stub = this.env.UserDO.get(id);

                const response = await stub.fetch(
                    new Request('http://localhost', {
                        headers: {
                            Upgrade: 'websocket',
                            'X-User-Id': currentUserId
                        }
                    })
                );

                if (response.status === 101 && response.webSocket) {
                    const { webSocket } = response;
                    webSocket.accept();
                    this.subscriptions.set(userId, {
                        status: 'offline',
                        webSocket
                    });
                    console.log(`[DO] Created WebSocket connection for ${userId}. Size: ${this.subscriptions.size}`);
                }
            }
        });
        console.log(`[DO] Subscribed to users: ${userIds.join(', ')}`);
        console.log(`[DO] Current subscriptions:`, this.subscriptions.size);
        this.confirmSubscribe();
        this.sendStatusUpdate();
    }

    confirmSubscribe() {
        if (!this.websocket) return;

        const data = JSON.stringify({ type: 'subscribed', subscribers: this.getUserStatuses() });
        this.websocket.send(data);
    }

    handleUnsubscribe(userIds: string[]) {
        userIds.forEach(async (userId) => {
            const subscription = this.subscriptions.get(userId);
            if (subscription) {
                subscription.webSocket.close();
            }
            this.subscriptions.delete(userId);
        });
        console.log(`[DO] Unsubscribed from users: ${userIds.join(', ')}`);
        this.sendStatusUpdate();
    }

    sendStatusUpdate() {
        if (!this.websocket) return;

        const statusMessage = JSON.stringify({
            type: 'status-update',
            subscriptions: this.getUserStatuses()
        });

        console.log(`[DO] Sending status update:`, statusMessage);
        const connections = this.getConnections();
        console.log({ connections });
        for (const connection of connections) {
            try {
                console.log(`[DO] Sending status update to connection`);
                connection.send(statusMessage);
            } catch (error) {
                console.error('[DO] Error sending status update:', error);
                connection.close();
                console.log(`[DO] WebSocket connection removed due to error.`);
            }
        }
    }
}
