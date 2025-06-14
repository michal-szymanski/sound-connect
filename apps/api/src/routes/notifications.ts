import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import { getFollowedUsers, followUser } from '@/api/db/queries/users-queries';
import { followRequestNotificationItem, followRequestAcceptedNotificationItem } from '@sound-connect/common/types/models';
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
        const updatedNotification = followRequestNotificationItem.parse(body);
        const existingFollowRequest = existingNotification as any;

        const wasAccepted = existingFollowRequest.accepted;
        const isBeingAccepted = updatedNotification.accepted && !wasAccepted;

        if (isBeingAccepted) {
            await followUser(user.id, updatedNotification.from);

            const requesterFollowedUsers = await getFollowedUsers(updatedNotification.from);
            const isMutualFollowing = requesterFollowedUsers.some((followed) => followed.id === user.id);

            const requesterStubId = c.env.UserDO.idFromName(`user:${updatedNotification.from}`);
            const requesterStub = c.env.UserDO.get(requesterStubId);

            const acceptedNotification = followRequestAcceptedNotificationItem.parse({
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                seen: false,
                from: user.id,
                to: updatedNotification.from
            });

            await requesterStub.sendFollowRequestAcceptedNotification(acceptedNotification);

            if (isMutualFollowing) {
                await stub.deleteNotification(notificationId);
                return c.json('ok');
            }
        }

        await stub.updateNotification(notificationId, updatedNotification);
    } else if (type === 'follow-request-accepted') {
        const updatedNotification = followRequestAcceptedNotificationItem.parse(body);
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

export { notificationsRoutes };
