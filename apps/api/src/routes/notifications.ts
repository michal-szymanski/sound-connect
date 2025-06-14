import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import { getFollowedUsers, followUser } from '@/api/db/queries/users-queries';
import { followRequestNotificationItem, followRequestAcceptedNotificationItem } from '@sound-connect/common/types/models';
import crypto from 'crypto';

const notificationsRoutes = new Hono<HonoContext>();

notificationsRoutes.post('/notifications/accept-follow-request', async (c) => {
    const body = await c.req.json();
    const {
        notification: { userId }
    } = z.object({ notification: followRequestNotificationItem }).parse(body);

    const user = c.get('user');

    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);

    const notifications = await stub.getFollowRequestNotifications();
    const notification = notifications.find((n) => n.userId === userId && !n.accepted);

    if (!notification) {
        return c.json('Follow request is required to be sent first', 400);
    }

    await followUser(user.id, notification.userId);

    const requesterFollowedUsers = await getFollowedUsers(userId);
    const isMutualFollowing = requesterFollowedUsers.some((followed) => followed.id === user.id);

    const requesterStubId = c.env.UserDO.idFromName(`user:${userId}`);
    const requesterStub = c.env.UserDO.get(requesterStubId);

    const acceptedNotification = followRequestAcceptedNotificationItem.parse({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        seen: false,
        userId: user.id
    });

    await requesterStub.sendFollowRequestAcceptedNotification(acceptedNotification);

    if (isMutualFollowing) {
        await stub.removeNotification(notification);
    } else {
        await stub.updateFollowRequestNotifications([{ ...notification, accepted: true }]);
    }

    return c.json('ok');
});

notificationsRoutes.post('/notifications/delete-follow-request', async (c) => {
    const body = await c.req.json();
    const { notification } = z.object({ notification: followRequestNotificationItem }).parse(body);

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);
    await stub.removeNotification(notification);

    return c.json('ok');
});

notificationsRoutes.post('/notifications/update-follow-request', async (c) => {
    const body = await c.req.json();
    const { notifications } = z.object({ notifications: z.array(followRequestNotificationItem) }).parse(body);

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);
    await stub.updateFollowRequestNotifications(notifications);

    return c.json('ok');
});

notificationsRoutes.post('/notifications/delete-follow-request-accepted', async (c) => {
    const body = await c.req.json();
    const { notification } = z.object({ notification: followRequestAcceptedNotificationItem }).parse(body);

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);
    await stub.removeFollowRequestAcceptedNotification(notification);

    return c.json('ok');
});

notificationsRoutes.post('/notifications/update-follow-request-accepted', async (c) => {
    const body = await c.req.json();
    const { notifications } = z.object({ notifications: z.array(followRequestAcceptedNotificationItem) }).parse(body);

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);

    await stub.updateFollowRequestAcceptedNotifications(notifications);

    return c.json('ok');
});

export { notificationsRoutes };
