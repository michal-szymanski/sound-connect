import { DurableObject } from 'cloudflare:workers';
import { TestNotificationMessage, testNotificationMessageSchema } from '@/common/types/models';

export class NotificationsDurableObject extends DurableObject {
    private connections: Map<string, WebSocket> = new Map();
    private storage: DurableObjectStorage;

    constructor(
        ctx: DurableObjectState,
        public override env: Cloudflare.Env
    ) {
        super(ctx, env);
        this.storage = ctx.storage;
    }

    override async fetch(request: Request): Promise<Response> {
        const upgradeHeader = request.headers.get('Upgrade');
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return new Response('Unauthorized: Missing user ID', { status: 401 });
        }

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
            const wsPair = new WebSocketPair();
            const client = wsPair[0];
            const server = wsPair[1];

            await this.handleConnection(server, userId);

            return new Response(null, { status: 101, webSocket: client });
        }

        return new Response('Not Found', { status: 404 });
    }

    async sendTestNotification(fromUserId: string, toUserId: string): Promise<boolean> {
        const targetConnection = this.connections.get(toUserId);

        if (!targetConnection || targetConnection.readyState !== WebSocket.OPEN) {
            return false;
        }

        const message: TestNotificationMessage = testNotificationMessageSchema.parse({
            type: 'test-notification',
            from: fromUserId,
            to: toUserId,
            message: `Test notification from ${fromUserId}`,
            timestamp: Date.now()
        });

        targetConnection.send(JSON.stringify(message));
        return true;
    }

    private async handleConnection(webSocket: WebSocket, userId: string) {
        webSocket.accept();
        this.connections.set(userId, webSocket);

        webSocket.addEventListener('close', () => {
            this.connections.delete(userId);
        });

        webSocket.addEventListener('error', () => {
            this.connections.delete(userId);
        });
    }
}
