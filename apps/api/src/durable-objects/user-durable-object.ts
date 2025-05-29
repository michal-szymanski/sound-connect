import { DurableObject } from 'cloudflare:workers';
import { ONLINE_STATUS_INTERVAL } from '@sound-connect/common/constants';
import { FollowRequestNotification, FollowRequestNotificationItem, OnlineStatusMessage, webSocketMessageSchema } from '@sound-connect/common/types';

export class UserDurableObject extends DurableObject {
    private websocket: WebSocket | null = null;
    private storage: DurableObjectStorage;
    private subscribers: Set<string> = new Set();
    private userId: string | null = null;

    constructor(
        ctx: DurableObjectState,
        public env: Cloudflare.Env
    ) {
        super(ctx, env);
        this.ctx = ctx;
        this.storage = ctx.storage;
        this.env = env;
    }

    async fetch(request: Request): Promise<Response> {
        const upgradeHeader = request.headers.get('Upgrade');
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return new Response('Unauthorized: Missing user ID', { status: 401 });
        }

        this.userId = userId;

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
            const wsPair = new WebSocketPair();
            const [client, server] = Object.values(wsPair);

            await this.handleConnection(server);
            server.accept();

            return new Response(null, { status: 101, webSocket: client });
        }

        return new Response('Not Found', { status: 404 });
    }

    async alarm() {
        const subscribers = Array.from(this.subscribers);

        for (const userId of subscribers) {
            const id = this.env.UserDO.idFromName(`user:${userId}`);
            const stub = this.env.UserDO.get(id);
            const success = await stub.notifyOnline(this.userId);

            if (!success) {
                this.unsubscribe([userId]);
            }
        }

        await this.storage.setAlarm(Date.now() + ONLINE_STATUS_INTERVAL);
    }

    subscribe(userIds: string[]) {
        userIds.forEach((id) => this.subscribers.add(id));
    }

    unsubscribe(userIds: string[]) {
        userIds.forEach((id) => this.subscribers.delete(id));
    }

    async notifyOnline(userId: string | null) {
        if (!userId || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            await this.storage.deleteAlarm();
            return false;
        }

        const message: OnlineStatusMessage = {
            type: 'online-status',
            userId,
            status: 'online'
        };

        this.websocket.send(JSON.stringify(message));

        return true;
    }

    async getFollowRequestNotifications() {
        return (await this.ctx.storage.get<FollowRequestNotificationItem[]>('notifications:follow-request')) || [];
    }

    private async setFollowRequestNotifications(notifications: FollowRequestNotificationItem[]) {
        await this.ctx.storage.put('notifications:follow-request', notifications);
    }

    private async addFollowRequestNotification(newNotification: FollowRequestNotificationItem) {
        const notifications = [...(await this.getFollowRequestNotifications()), newNotification];
        await this.setFollowRequestNotifications(notifications);
        return notifications;
    }

    public async updateFollowRequestNotification(newNotification: FollowRequestNotificationItem) {
        const notifications = (await this.getFollowRequestNotifications()).map((n) => {
            if (n.id === newNotification.id) {
                return newNotification;
            }
            return n;
        });

        await this.setFollowRequestNotifications(notifications);
        await this.broadcastNotifications(notifications);
    }

    public async removeNotification(notification: FollowRequestNotificationItem) {
        const notifications = (await this.getFollowRequestNotifications()).filter((n) => n.id !== notification.id);
        await this.setFollowRequestNotifications(notifications);
        await this.broadcastNotifications(notifications);
    }

    private async broadcastNotifications(notifications: FollowRequestNotificationItem[]) {
        if (!this.websocket) return;

        const message: FollowRequestNotification = {
            type: 'notification',
            kind: 'follow-request',
            items: notifications
        };

        this.websocket.send(JSON.stringify(message));
    }

    async sendFollowRequestNotification(newNotification: FollowRequestNotificationItem) {
        const notifications = await this.addFollowRequestNotification(newNotification);
        await this.broadcastNotifications(notifications);
    }

    async handleConnection(webSocket: WebSocket) {
        this.websocket = webSocket;

        webSocket.addEventListener('message', async (event) => {
            const json = JSON.parse(event.data);
            const { type } = webSocketMessageSchema.parse(json);

            if (type === 'connect') {
                this.storage.setAlarm(Date.now() + ONLINE_STATUS_INTERVAL);
                const notifications = await this.getFollowRequestNotifications();
                await this.broadcastNotifications(notifications);
            } else if (type === 'disconnect') {
                this.storage.deleteAlarm();
            }
        });
    }
}
