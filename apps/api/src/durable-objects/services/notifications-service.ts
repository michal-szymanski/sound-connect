import {
    FollowRequestNotificationItem,
    FollowRequestAcceptedNotificationItem,
    followRequestAcceptedNotificationSchema,
    followRequestNotificationSchema,
    WebSocketMessage
} from '@/common/types/models';

const NOTIFICATIONS_KEY = 'notifications';

type NotificationItem = FollowRequestNotificationItem | FollowRequestAcceptedNotificationItem;

type StoredNotification =
    | {
          kind: 'follow-request';
          notification: FollowRequestNotificationItem;
      }
    | {
          kind: 'follow-request-accepted';
          notification: FollowRequestAcceptedNotificationItem;
      };

export class NotificationsService {
    constructor(
        private storage: DurableObjectStorage,
        private sendMessage: (message: WebSocketMessage) => Promise<void>
    ) {}

    async sendFollowRequestNotification(newNotification: FollowRequestNotificationItem) {
        await this.addNotification('follow-request', newNotification);
        const followRequestNotifications = await this.getNotificationsByKind('follow-request');
        const message = followRequestNotificationSchema.parse({
            type: 'notification',
            kind: 'follow-request',
            items: followRequestNotifications
        });
        await this.sendMessage(message);
    }

    async sendFollowRequestAcceptedNotification(newNotification: FollowRequestAcceptedNotificationItem) {
        await this.addNotification('follow-request-accepted', newNotification);
        const followRequestAcceptedNotifications = await this.getNotificationsByKind('follow-request-accepted');
        const message = followRequestAcceptedNotificationSchema.parse({
            type: 'notification',
            kind: 'follow-request-accepted',
            items: followRequestAcceptedNotifications
        });
        await this.sendMessage(message);
    }

    private async addNotification(kind: 'follow-request', notification: FollowRequestNotificationItem): Promise<void>;
    private async addNotification(kind: 'follow-request-accepted', notification: FollowRequestAcceptedNotificationItem): Promise<void>;
    private async addNotification(kind: string, notification: NotificationItem) {
        const allNotifications = await this.getNotifications();
        const newStoredNotification = { kind, notification } as StoredNotification;
        allNotifications.push(newStoredNotification);
        await this.setNotifications(allNotifications);
    }

    private async getNotifications(): Promise<StoredNotification[]> {
        return (await this.storage.get<StoredNotification[]>(NOTIFICATIONS_KEY)) || [];
    }

    private async setNotifications(notifications: StoredNotification[]) {
        await this.storage.put(NOTIFICATIONS_KEY, notifications);
    }

    private async getNotificationsByKind(kind: 'follow-request'): Promise<FollowRequestNotificationItem[]>;
    private async getNotificationsByKind(kind: 'follow-request-accepted'): Promise<FollowRequestAcceptedNotificationItem[]>;
    private async getNotificationsByKind(kind: 'follow-request' | 'follow-request-accepted') {
        const allNotifications = await this.getNotifications();
        return allNotifications.filter((stored) => stored.kind === kind).map((stored) => stored.notification);
    }

    async getFollowRequestNotifications() {
        return this.getNotificationsByKind('follow-request');
    }

    async getFollowRequestAcceptedNotifications() {
        return this.getNotificationsByKind('follow-request-accepted');
    }

    async updateNotification(notificationId: string, updatedNotification: NotificationItem) {
        const allNotifications = await this.getNotifications();
        const storedNotification = allNotifications.find((stored) => stored.notification.id === notificationId);

        if (!storedNotification) {
            return false;
        }

        Object.assign(storedNotification.notification, updatedNotification);
        await this.setNotifications(allNotifications);

        if (storedNotification.kind === 'follow-request') {
            const notificationsOfType = await this.getNotificationsByKind('follow-request');
            const message = followRequestNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request',
                items: notificationsOfType
            });
            await this.sendMessage(message);
        } else if (storedNotification.kind === 'follow-request-accepted') {
            const notificationsOfType = await this.getNotificationsByKind('follow-request-accepted');
            const message = followRequestAcceptedNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request-accepted',
                items: notificationsOfType
            });
            await this.sendMessage(message);
        }

        return true;
    }

    async deleteNotification(notificationId: string) {
        const allNotifications = await this.getNotifications();
        const storedNotification = allNotifications.find((stored) => stored.notification.id === notificationId);

        if (!storedNotification) {
            return false;
        }

        const filteredNotifications = allNotifications.filter((stored) => stored.notification.id !== notificationId);
        await this.setNotifications(filteredNotifications);

        if (storedNotification.kind === 'follow-request') {
            const notificationsOfType = await this.getNotificationsByKind('follow-request');
            const message = followRequestNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request',
                items: notificationsOfType
            });
            await this.sendMessage(message);
        } else if (storedNotification.kind === 'follow-request-accepted') {
            const notificationsOfType = await this.getNotificationsByKind('follow-request-accepted');
            const message = followRequestAcceptedNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request-accepted',
                items: notificationsOfType
            });
            await this.sendMessage(message);
        }

        return true;
    }

    async getNotification(notificationId: string) {
        const allNotifications = await this.getNotifications();
        const storedNotification = allNotifications.find((stored) => stored.notification.id === notificationId);

        if (!storedNotification) {
            return null;
        }

        return { type: storedNotification.kind, notification: storedNotification.notification };
    }

    async broadcastNotifications() {
        const followRequestNotifications = await this.getNotificationsByKind('follow-request');
        if (followRequestNotifications.length > 0) {
            const message = followRequestNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request',
                items: followRequestNotifications
            });
            await this.sendMessage(message);
        }

        const followRequestAcceptedNotifications = await this.getNotificationsByKind('follow-request-accepted');
        if (followRequestAcceptedNotifications.length > 0) {
            const message = followRequestAcceptedNotificationSchema.parse({
                type: 'notification',
                kind: 'follow-request-accepted',
                items: followRequestAcceptedNotifications
            });
            await this.sendMessage(message);
        }
    }
}
