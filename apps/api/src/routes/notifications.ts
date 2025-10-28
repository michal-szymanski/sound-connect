import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import { getFollowedUsers, followUser } from '@/api/db/queries/users-queries';
import { followRequestNotificationItemSchema, followRequestAcceptedNotificationItemSchema, sendTestNotificationSchema } from '@/common/types/models';
import crypto from 'crypto';

const notificationsRoutes = new Hono<HonoContext>();

notificationsRoutes.put('/notifications/:notificationId', async (c) => {
    const { notificationId } = z.object({ notificationId: z.string() }).parse(c.req.param());
    const body = await c.req.json();

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);

    const existingNotificationData = await stub.getNotification(notificationId);

    if (!existingNotificationData) {
        return c.json('Notification not found', 404);
    }

    const { type, notification: existingNotification } = existingNotificationData;

    if (type === 'follow-request') {
        const updatedNotification = followRequestNotificationItemSchema.parse(body);
        const existingFollowRequest = followRequestNotificationItemSchema.parse(existingNotification);

        const wasAccepted = existingFollowRequest.accepted;
        const isBeingAccepted = updatedNotification.accepted && !wasAccepted;

        if (isBeingAccepted) {
            await followUser(user.id, updatedNotification.from);

            const requesterFollowedUsers = await getFollowedUsers(updatedNotification.from);
            const isMutualFollowing = requesterFollowedUsers.some((followed) => followed.id === user.id);

            const requesterStubId = c.env.UserDO.idFromName(`user:${updatedNotification.from}`);
            const requesterStub = c.env.UserDO.get(requesterStubId);

            const acceptedNotification = followRequestAcceptedNotificationItemSchema.parse({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                seen: false,
                from: user.id,
                to: updatedNotification.from
            });

            await requesterStub.sendFollowRequestAcceptedNotification(acceptedNotification);

            if (isMutualFollowing) {
                await stub.subscribe(updatedNotification.from);
                await requesterStub.subscribe(user.id);
                await stub.deleteNotification(notificationId);
                return c.json('ok');
            }
        }

        await stub.updateNotification(notificationId, updatedNotification);
    } else if (type === 'follow-request-accepted') {
        const updatedNotification = followRequestAcceptedNotificationItemSchema.parse(body);

        const followedUsers = await getFollowedUsers(user.id);
        const isAlreadyFollowing = followedUsers.some((followed) => followed.id === updatedNotification.from);

        if (!isAlreadyFollowing) {
            await followUser(user.id, updatedNotification.from);

            const accepterFollowedUsers = await getFollowedUsers(updatedNotification.from);
            const isMutualFollowing = accepterFollowedUsers.some((followed) => followed.id === user.id);

            if (isMutualFollowing) {
                const accepterStubId = c.env.UserDO.idFromName(`user:${updatedNotification.from}`);
                const accepterStub = c.env.UserDO.get(accepterStubId);

                await stub.subscribe(updatedNotification.from);
                await accepterStub.subscribe(user.id);
                await stub.deleteNotification(notificationId);
                return c.json('ok');
            }
        }

        await stub.updateNotification(notificationId, updatedNotification);
    }

    return c.json('ok');
});

notificationsRoutes.delete('/notifications/:notificationId', async (c) => {
    const { notificationId } = z.object({ notificationId: z.string() }).parse(c.req.param());

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);

    const success = await stub.deleteNotification(notificationId);

    if (!success) {
        return c.json('Notification not found', 404);
    }

    return c.json('ok');
});

notificationsRoutes.post('/notifications/test', async (c) => {
    const body = await c.req.json();
    const { targetUserId } = sendTestNotificationSchema.parse(body);

    const user = c.get('user');
    const id = c.env.NotificationsDO.idFromName('notifications:global');
    const stub = c.env.NotificationsDO.get(id);

    const success = await stub.sendTestNotification(user.id, targetUserId);

    if (!success) {
        return c.json({ error: 'Target user not connected' }, 400);
    }

    return c.json({ success: true });
});

export { notificationsRoutes };
