import { DurableObject } from 'cloudflare:workers';
import { ONLINE_STATUS_INTERVAL } from '@sound-connect/common/constants';
import {
    FollowRequestNotificationItem,
    FollowRequestAcceptedNotificationItem,
    WebSocketMessage,
    webSocketMessageSchema,
    onlineStatusMessageSchema,
    UserDTO
} from '@sound-connect/common/types/models';
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
        public env: Cloudflare.Env
    ) {
        super(ctx, env);
        this.storage = ctx.storage;
        this.notificationsService = new NotificationsService(this.storage, this.sendMessage.bind(this));
        this.chatService = new ChatService(this.storage, this.env, this.userId);
    }

    async fetch(request: Request): Promise<Response> {
        const upgradeHeader = request.headers.get('Upgrade');
        const userId = request.headers.get('X-User-Id');

        if (!userId) {
            return new Response('Unauthorized: Missing user ID', { status: 401 });
        }

        this.userId = userId;
        this.chatService.updateUserId(userId);

        if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
            const wsPair = new WebSocketPair();
            const [client, server] = Object.values(wsPair);

            await this.handleConnection(server);
            await this.chatService.initializeRooms();
            await this.storage.setAlarm(Date.now() + ONLINE_STATUS_INTERVAL);

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

    async getStorageForDebug() {
        try {
            const list = await this.storage.list();

            const storage = Array.from(list.entries()).map(([key, value]) => ({
                [key]: value
            }));

            return storage;
        } catch (error) {
            console.error(`[UserDO] Error getting storage debug for ${this.userId}:`, error);
            throw new Error(`Failed to retrieve storage data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendMessage(message: WebSocketMessage) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        }
    }

    async notifyOnline(userId: string | null) {
        console.log('notifyOnline', userId);
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

    initializeSubscribers(users: UserDTO[]) {
        this.subscribers = new Set(users.map((user) => user.id));
    }

    private unsubscribe(userIds: string[]) {
        userIds.forEach((id) => this.subscribers.delete(id));
    }

    private async broadcastNotifications() {
        await this.notificationsService.broadcastNotifications();
    }

    private async handleConnection(webSocket: WebSocket) {
        webSocket.accept();
        this.websocket = webSocket;

        webSocket.addEventListener('message', async (event) => {
            try {
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
                    default:
                        console.log(`[UserDO] Unhandled message type: ${parsedMessage.type}`);
                        break;
                }
            } catch (error) {
                console.error(`[UserDO] Error processing message from user ${this.userId}:`, error);
            }
        });

        webSocket.addEventListener('close', () => {
            this.websocket = null;
            this.chatService.cleanup();
        });

        await this.broadcastNotifications();
    }
}
