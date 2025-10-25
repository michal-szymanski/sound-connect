import { DurableObject } from 'cloudflare:workers';
import { ONLINE_STATUS_INTERVAL } from '@/common/constants';
import {
    FollowRequestNotificationItem,
    FollowRequestAcceptedNotificationItem,
    WebSocketMessage,
    webSocketMessageSchema,
    onlineStatusMessageSchema,
    UserDTO
} from '@/common/types/models';
import { NotificationsService } from './services/notifications-service';
import { ChatService } from './services/chat-service';
import z from 'zod';

export class UserDurableObject extends DurableObject {
    private websocket: WebSocket | null = null;
    private storage: DurableObjectStorage;
    private subscribers: Set<string> = new Set();
    private userId: string | null = null;
    private notificationsService: NotificationsService;
    private chatService: ChatService;

    constructor(
        ctx: DurableObjectState,
        public override env: Cloudflare.Env
    ) {
        super(ctx, env);
        this.storage = ctx.storage;
        this.notificationsService = new NotificationsService(this.storage, this.sendMessage.bind(this));
        this.chatService = new ChatService(this.storage, this.env, this.userId);
    }

    override async fetch(request: Request): Promise<Response> {
        const upgradeHeader = request.headers.get('Upgrade');
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return new Response('Unauthorized: Missing user ID', { status: 401 });
        }

        this.userId = userId;
        this.chatService.updateUserId(userId);

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
            const wsPair = new WebSocketPair();
            const client = wsPair[0];
            const server = wsPair[1];

            await this.handleConnection(server);
            await this.chatService.initializeRooms();
            await this.subscribeOthersToCurrentUser();
            await this.storage.setAlarm(Date.now() + ONLINE_STATUS_INTERVAL);

            return new Response(null, { status: 101, webSocket: client });
        }

        return new Response('Not Found', { status: 404 });
    }

    override async alarm() {
        if (!this.userId) {
            return;
        }

        const subscribers = Array.from(this.subscribers);

        for (const userId of subscribers) {
            const id = this.env.UserDO.idFromName(`user:${userId}`);
            const stub = this.env.UserDO.get(id);
            const success = await stub.notifyOnline(this.userId);

            if (!success) {
                this.unsubscribe(userId);
            }
        }

        await this.storage.setAlarm(Date.now() + ONLINE_STATUS_INTERVAL);
    }

    async getStorageForDebug() {
        try {
            const list = await this.storage.list();

            const storage = Array.from(list.entries()).map(([key, value]) => ({
                [key]: value
            }));

            return storage;
        } catch (error) {
            throw new Error(`Failed to retrieve storage data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendMessage(message: WebSocketMessage) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        }
    }

    async notifyOnline(userId: string | null) {
        if (!userId || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            await this.storage.deleteAlarm();
            return false;
        }

        const message = onlineStatusMessageSchema.parse({
            type: 'online-status',
            userId,
            status: 'online'
        });

        this.sendMessage(message);

        return true;
    }

    async sendFollowRequestNotification(newNotification: FollowRequestNotificationItem) {
        return this.notificationsService.sendFollowRequestNotification(newNotification);
    }

    async sendFollowRequestAcceptedNotification(newNotification: FollowRequestAcceptedNotificationItem) {
        return this.notificationsService.sendFollowRequestAcceptedNotification(newNotification);
    }

    async getFollowRequestNotifications() {
        return this.notificationsService.getFollowRequestNotifications();
    }

    async getFollowRequestAcceptedNotifications() {
        return this.notificationsService.getFollowRequestAcceptedNotifications();
    }

    async updateNotification(notificationId: string, updatedNotification: FollowRequestNotificationItem | FollowRequestAcceptedNotificationItem) {
        return this.notificationsService.updateNotification(notificationId, updatedNotification);
    }

    async deleteNotification(notificationId: string) {
        return this.notificationsService.deleteNotification(notificationId);
    }

    async getNotification(notificationId: string) {
        return this.notificationsService.getNotification(notificationId);
    }

    async clearAllNotifications() {
        await this.storage.delete('notifications');
        return true;
    }

    async clearAllSubscribers() {
        this.subscribers.clear();
        return true;
    }

    async clearChatRooms() {
        await this.storage.delete('chat-rooms');
        return true;
    }

    async resetUserState() {
        await this.storage.delete('notifications');
        await this.storage.delete('chat-rooms');
        this.subscribers.clear();
        return true;
    }

    initializeSubscribers(users: UserDTO[]) {
        this.subscribers = new Set(users.map((user) => user.id));
    }

    private async subscribeOthersToCurrentUser() {
        if (!this.userId) return;

        const subscribers = Array.from(this.subscribers);

        for (const userId of subscribers) {
            const id = this.env.UserDO.idFromName(`user:${userId}`);
            const stub = this.env.UserDO.get(id);
            await stub.subscribe(this.userId);
        }
    }

    async subscribe(userId: string) {
        this.subscribers.add(userId);
    }

    private unsubscribe(userId: string) {
        this.subscribers.delete(userId);
    }

    private async broadcastNotifications() {
        await this.notificationsService.broadcastNotifications();
    }

    private async handleConnection(webSocket: WebSocket) {
        webSocket.accept();
        this.websocket = webSocket;

        webSocket.addEventListener('message', async (event) => {
            const rawData = z.string().parse(event.data);
            const message = JSON.parse(rawData);

            const parsedMessage = webSocketMessageSchema.parse(message);

            switch (parsedMessage.type) {
                case 'subscribe':
                    await this.chatService.subscribeToRoom(parsedMessage);
                    break;
                case 'unsubscribe':
                    await this.chatService.unsubscribeFromRoom(parsedMessage);
                    break;
                case 'chat':
                    await this.chatService.handleChatMessage(parsedMessage);
                    break;
            }
        });

        webSocket.addEventListener('close', () => {
            this.websocket = null;
            this.chatService.cleanup();
        });

        await this.broadcastNotifications();
    }
}
