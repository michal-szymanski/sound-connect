import { DurableObject } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import { schema } from '@sound-connect/drizzle';
import { notificationSchema } from '@sound-connect/common/types/drizzle';
import { desc, eq } from 'drizzle-orm';
import z from 'zod';

const { notificationsTable } = schema;

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
        const url = new URL(request.url);
        const upgradeHeader = request.headers.get('Upgrade');
        const userId = request.headers.get('X-User-Id');

        if (url.pathname === '/send-notification-realtime' && request.method === 'POST') {
            const body = (await request.json()) as {
                userId: string;
                notification: unknown;
            };
            this.sendNotificationToUser(body.userId, body.notification);
            return new Response('OK', { status: 200 });
        }

        if (!userId) {
            console.error('[NotificationsDO] Missing user ID');
            return new Response('Unauthorized: Missing user ID', { status: 401 });
        }

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
            const wsPair = new WebSocketPair();
            const client = wsPair[0];
            const server = wsPair[1];

            await this.handleConnection(server, userId);

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

        console.error('[NotificationsDO] Invalid request');
        return new Response('Not Found', { status: 404 });
    }

    private async handleConnection(webSocket: WebSocket, userId: string) {
        webSocket.accept();
        this.connections.set(userId, webSocket);

        const notifications = await this.getUserNotifications(userId, 50);

        webSocket.send(
            JSON.stringify({
                type: 'initial',
                data: notifications
            })
        );

        webSocket.addEventListener('close', () => {
            this.connections.delete(userId);
        });

        webSocket.addEventListener('error', (error) => {
            console.error('[NotificationsDO] WebSocket error for user:', userId, error);
            this.connections.delete(userId);
        });
    }

    private sendNotificationToUser(userId: string, notification: unknown) {
        const connection = this.connections.get(userId);
        if (connection) {
            connection.send(
                JSON.stringify({
                    type: 'notification',
                    data: notification
                })
            );
        }
    }

    private async getUserNotifications(userId: string, limit?: number) {
        const db = drizzle(this.env.DB, { schema });

        const baseQuery = db
            .select({
                id: notificationsTable.id,
                userId: notificationsTable.userId,
                type: notificationsTable.type,
                actorId: notificationsTable.actorId,
                entityId: notificationsTable.entityId,
                entityType: notificationsTable.entityType,
                content: notificationsTable.content,
                seen: notificationsTable.seen,
                createdAt: notificationsTable.createdAt
            })
            .from(notificationsTable)
            .where(eq(notificationsTable.userId, userId))
            .orderBy(desc(notificationsTable.createdAt));

        const results = limit !== undefined ? await baseQuery.limit(limit) : await baseQuery;

        const arraySchema = z.array(notificationSchema);
        return arraySchema.parse(results);
    }
}
