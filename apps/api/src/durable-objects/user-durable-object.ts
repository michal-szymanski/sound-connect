import { DurableObject } from 'cloudflare:workers';
import { ONLINE_STATUS_INTERVAL } from '@sound-connect/common/constants';
import {
    FollowRequestNotificationItem,
    FollowRequestAcceptedNotificationItem,
    NewChatMessage,
    SubscribeMessage,
    UnsubscribeMessage,
    WebSocketMessage,
    webSocketMessageSchema,
    followRequestAcceptedNotificationSchema,
    followRequestNotificationSchema,
    onlineStatusMessageSchema,
    NotificationMessage
} from '@sound-connect/common/types/models';

import z from 'zod';

type NotificationItem = FollowRequestNotificationItem | FollowRequestAcceptedNotificationItem;

export class UserDurableObject extends DurableObject {
    private websocket: WebSocket | null = null;
    private storage: DurableObjectStorage;
    private subscribedRooms: Set<string> = new Set();
    private subscribers: Set<string> = new Set();
    private userId: string | null = null;

    constructor(
        ctx: DurableObjectState,
        public env: Cloudflare.Env
    ) {
        super(ctx, env);
        this.storage = ctx.storage;
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

            server.accept();
            await this.handleConnection(server);

            return new Response(null, { status: 101, webSocket: client });
        }

        const url = new URL(request.url);
        if (request.method === 'GET' && url.pathname.includes('/history')) {
            const pathParts = url.pathname.split('/');
            const roomId = pathParts[pathParts.length - 2];
            return this.getRoomHistory(roomId);
        }

        return new Response('Not Found', { status: 404 });
    }

    async handleConnection(webSocket: WebSocket) {
        this.websocket = webSocket;

        const storedRooms = await this.storage.get<string[]>('subscribed-rooms');
        if (storedRooms) {
            this.subscribedRooms = new Set(storedRooms);
        }

        webSocket.addEventListener('message', async (event) => {
            try {
                const rawData = z.string().parse(event.data);
                const message = JSON.parse(rawData);

                const parsedMessage = webSocketMessageSchema.parse(message);

                switch (parsedMessage.type) {
                    case 'subscribe':
                        await this.subscribeToRoom(parsedMessage);
                        break;
                    case 'unsubscribe':
                        await this.unsubscribeFromRoom(parsedMessage);
                        break;
                    case 'chat':
                        await this.handleChatMessage(parsedMessage);
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
            this.cleanup();
        });

        await this.broadcastAllNotifications();
    }

    private async subscribeToRoom({ roomId }: SubscribeMessage) {
        this.subscribedRooms.add(roomId);

        await this.storage.put('subscribed-rooms', Array.from(this.subscribedRooms));

        try {
            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            await chatStub.subscribeUser(this.userId!, roomId);
        } catch (error) {
            console.error(`[UserDO] Error subscribing to room ${roomId}:`, error);
        }
    }

    private async unsubscribeFromRoom({ roomId }: UnsubscribeMessage) {
        this.subscribedRooms.delete(roomId);

        await this.storage.put('subscribed-rooms', Array.from(this.subscribedRooms));

        try {
            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            await chatStub.unsubscribeUser(this.userId!, roomId);
        } catch (error) {
            console.error(`[UserDO] Error unsubscribing from room ${roomId}:`, error);
        }
    }

    private async handleChatMessage({ roomId, content }: NewChatMessage) {
        if (!this.subscribedRooms.has(roomId) || !this.userId) {
            return;
        }

        try {
            const senderId = this.userId;

            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            await chatStub.sendMessage(senderId, roomId, content);
        } catch (error) {
            console.error(`[UserDO] Error sending message to room ${roomId}:`, error);
        }
    }

    async getRoomHistory(roomId: string): Promise<Response> {
        try {
            const chatId = this.env.ChatDO.idFromName(`room:${roomId}`);
            const chatStub = this.env.ChatDO.get(chatId);
            const history = await chatStub.getRoomHistory(roomId);

            return new Response(JSON.stringify(history), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error(`[UserDO] Error getting room history for ${roomId}:`, error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }

    async sendMessage(message: WebSocketMessage) {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        }
    }

    private async cleanup() {
        for (const roomId of this.subscribedRooms) {
            await this.unsubscribeFromRoom({ type: 'unsubscribe', roomId });
        }
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

        const message = onlineStatusMessageSchema.parse({
            type: 'online-status',
            userId,
            status: 'online'
        });

        this.websocket.send(JSON.stringify(message));

        return true;
    }

    async sendFollowRequestNotification(newNotification: FollowRequestNotificationItem) {
        const notifications = await this.addFollowRequestNotification(newNotification);
        const message = followRequestNotificationSchema.parse({
            type: 'notification',
            kind: 'follow-request',
            items: notifications
        });
        await this.broadcastNotifications(message);
    }

    private async addFollowRequestNotification(newNotification: FollowRequestNotificationItem) {
        const notifications = [...(await this.getFollowRequestNotifications()), newNotification];
        await this.setFollowRequestNotifications(notifications);
        return notifications;
    }

    private async broadcastNotifications(message: NotificationMessage) {
        if (!this.websocket) return;
        this.websocket.send(JSON.stringify(message));
    }

    async getFollowRequestNotifications() {
        return (await this.storage.get<FollowRequestNotificationItem[]>('notifications:follow-request')) || [];
    }

    private async setFollowRequestNotifications(notifications: FollowRequestNotificationItem[]) {
        await this.storage.put('notifications:follow-request', notifications);
    }

    async sendFollowRequestAcceptedNotification(newNotification: FollowRequestAcceptedNotificationItem) {
        const notifications = await this.addFollowRequestAcceptedNotification(newNotification);
        const message = followRequestAcceptedNotificationSchema.parse({
            type: 'notification',
            kind: 'follow-request-accepted',
            items: notifications
        });
        await this.broadcastNotifications(message);
    }

    private async addFollowRequestAcceptedNotification(newNotification: FollowRequestAcceptedNotificationItem) {
        const existingNotifications = await this.getFollowRequestAcceptedNotifications();
        const notifications = [...existingNotifications, newNotification];
        await this.setFollowRequestAcceptedNotifications(notifications);
        return notifications;
    }

    async getFollowRequestAcceptedNotifications() {
        return (await this.storage.get<FollowRequestAcceptedNotificationItem[]>('notifications:follow-request-accepted')) || [];
    }

    private async setFollowRequestAcceptedNotifications(notifications: FollowRequestAcceptedNotificationItem[]) {
        await this.storage.put('notifications:follow-request-accepted', notifications);
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

    private async broadcastAllNotifications() {
        if (!this.websocket) return;

        const followRequestNotifications = await this.getFollowRequestNotifications();
        if (followRequestNotifications.length > 0) {
            const message = followRequestNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request',
                items: followRequestNotifications
            });
            await this.broadcastNotifications(message);
        }

        const followRequestAcceptedNotifications = await this.getFollowRequestAcceptedNotifications();
        if (followRequestAcceptedNotifications.length > 0) {
            const message = followRequestAcceptedNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request-accepted',
                items: followRequestAcceptedNotifications
            });
            await this.broadcastNotifications(message);
        }
    }

    async updateNotification(notificationId: string, updatedNotification: NotificationItem) {
        const followRequestNotifications = await this.getFollowRequestNotifications();
        const followRequestNotification = followRequestNotifications.find((n) => n.id === notificationId);

        if (followRequestNotification) {
            Object.assign(followRequestNotification, updatedNotification);
            await this.setFollowRequestNotifications(followRequestNotifications);
            const message = followRequestNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request',
                items: followRequestNotifications
            });
            await this.broadcastNotifications(message);
            return true;
        }

        const followRequestAcceptedNotifications = await this.getFollowRequestAcceptedNotifications();
        const acceptedNotification = followRequestAcceptedNotifications.find((n) => n.id === notificationId);

        if (acceptedNotification) {
            Object.assign(acceptedNotification, updatedNotification);
            await this.setFollowRequestAcceptedNotifications(followRequestAcceptedNotifications);
            const message = followRequestAcceptedNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request-accepted',
                items: followRequestAcceptedNotifications
            });
            await this.broadcastNotifications(message);
            return true;
        }

        return false;
    }

    async deleteNotification(notificationId: string) {
        const followRequestNotifications = await this.getFollowRequestNotifications();
        const followRequestNotification = followRequestNotifications.find((n) => n.id === notificationId);

        if (followRequestNotification) {
            const filtered = followRequestNotifications.filter((n) => n.id !== notificationId);
            await this.setFollowRequestNotifications(filtered);
            const message = followRequestNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request',
                items: filtered
            });
            await this.broadcastNotifications(message);
            return true;
        }

        const followRequestAcceptedNotifications = await this.getFollowRequestAcceptedNotifications();
        const acceptedNotification = followRequestAcceptedNotifications.find((n) => n.id === notificationId);

        if (acceptedNotification) {
            const filtered = followRequestAcceptedNotifications.filter((n) => n.id !== notificationId);
            await this.setFollowRequestAcceptedNotifications(filtered);
            const message = followRequestAcceptedNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request-accepted',
                items: filtered
            });
            await this.broadcastNotifications(message);
            return true;
        }

        return false;
    }

    async getNotification(notificationId: string) {
        const followRequestNotifications = await this.getFollowRequestNotifications();
        const followRequestNotification = followRequestNotifications.find((n) => n.id === notificationId);

        if (followRequestNotification) {
            return { type: 'follow-request', notification: followRequestNotification };
        }

        const followRequestAcceptedNotifications = await this.getFollowRequestAcceptedNotifications();
        const acceptedNotification = followRequestAcceptedNotifications.find((n) => n.id === notificationId);

        if (acceptedNotification) {
            return { type: 'follow-request-accepted', notification: acceptedNotification };
        }

        return null;
    }
}
