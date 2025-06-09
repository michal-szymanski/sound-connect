import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import { getFollowedUsers, getUserFollowers, getUserById, followUser, unfollowUser, getMutualFollowers } from '@/api/db/queries/users-queries';
import { followRequestNotificationItem } from '@sound-connect/common/types/models';
import crypto from 'crypto';

const usersRoutes = new Hono<HonoContext>();

usersRoutes.get('/users/followers/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const followersResults = await getFollowedUsers(userId);

    return c.json(followersResults);
});

usersRoutes.get('/users/followings/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const followingsResults = await getUserFollowers(userId);

    return c.json(followingsResults);
});

usersRoutes.post('/users/send-follow-request', async (c) => {
    const body = await c.req.json();
    const { userId } = z.object({ userId: z.string() }).parse(body);

    const user = c.get('user');
    const followedUsers = await getFollowedUsers(user.id);

    if (followedUsers.some((followed) => followed.id === userId)) {
        return c.json('User is already followed', 400);
    }

    const id = c.env.UserDO.idFromName(`user:${userId}`);
    const stub = c.env.UserDO.get(id);

    const notifications = await stub.getFollowRequestNotifications();

    if (notifications.some((n) => n.userId === user.id)) {
        return c.json('User is already notified about follow request', 400);
    }

    const currentUserId = c.env.UserDO.idFromName(`user:${user.id}`);
    const currentUserStub = c.env.UserDO.get(currentUserId);

    const currentUserNotifications = await currentUserStub.getFollowRequestNotifications();

    const notificationToRemove = currentUserNotifications.find((n) => n.userId === userId && n.accepted);

    if (notificationToRemove) {
        await currentUserStub.removeNotification(notificationToRemove);
    }

    await stub.sendFollowRequestNotification({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        seen: false,
        accepted: false,
        userId: user.id
    });

    return c.json('ok');
});

usersRoutes.post('/users/accept-follow-request', async (c) => {
    const body = await c.req.json();
    const {
        notification: { userId }
    } = z.object({ notification: followRequestNotificationItem }).parse(body);

    const user = c.get('user');
    const followedUsers = await getFollowedUsers(userId);

    if (followedUsers.some((followed) => followed.id === userId)) {
        return c.json('User is already followed', 400);
    }

    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);

    const notifications = await stub.getFollowRequestNotifications();
    const notification = notifications.find((n) => n.userId === userId && !n.accepted);

    if (!notification) {
        return c.json('Follow request is required to be sent first', 400);
    }

    await followUser(user.id, notification.userId);
    const followedUsersByCurrentUser = await getFollowedUsers(user.id);

    if (followedUsersByCurrentUser.some((followed) => followed.id === userId)) {
        await stub.removeNotification(notification);

        const requesterStubId = c.env.UserDO.idFromName(`user:${userId}`);
        const requesterStub = c.env.UserDO.get(requesterStubId);

        const acceptedNotification = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            seen: false,
            userId: user.id
        };

        await requesterStub.sendFollowRequestAcceptedNotification(acceptedNotification);
    } else {
        await stub.updateFollowRequestNotifications([{ ...notification, accepted: true }]);
    }

    return c.json('ok');
});

usersRoutes.post('/users/delete-notification', async (c) => {
    const body = await c.req.json();
    const { notification } = z.object({ notification: followRequestNotificationItem }).parse(body);

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);
    await stub.removeNotification(notification);

    return c.json('ok');
});

usersRoutes.post('/users/update-notifications', async (c) => {
    const body = await c.req.json();
    const { notifications } = z.object({ notifications: z.array(followRequestNotificationItem) }).parse(body);

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);
    await stub.updateFollowRequestNotifications(notifications);

    return c.json('ok');
});

usersRoutes.post('/users/unfollow', async (c) => {
    const body = await c.req.json();
    const { userId } = z.object({ userId: z.string() }).parse(body);

    const user = c.get('user');
    await unfollowUser(user.id, userId);

    return c.json('ok');
});

usersRoutes.get('/users/mutual-followers/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const usersResults = await getMutualFollowers(userId);

    return c.json(usersResults);
});

usersRoutes.get('/users/follow-request-status/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const user = c.get('user');

    const followedUsers = await getFollowedUsers(user.id);
    if (followedUsers.some((followed) => followed.id === userId)) {
        return c.json({ status: 'following' });
    }

    const id = c.env.UserDO.idFromName(`user:${userId}`);
    const stub = c.env.UserDO.get(id);
    const notifications = await stub.getFollowRequestNotifications();

    const pendingRequest = notifications.find((n) => n.userId === user.id && !n.accepted);

    if (pendingRequest) {
        return c.json({ status: 'pending' });
    }

    return c.json({ status: 'none' });
});

usersRoutes.get('/users/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    try {
        const user = await getUserById(userId);
        return c.json(user);
    } catch (error) {
        console.error(`Error fetching user with ID ${userId}:`, error);
        return c.json(`User with ID ${userId} not found`, 404);
    }
});

usersRoutes.post('/users/delete-follow-request-accepted-notification', async (c) => {
    const body = await c.req.json();
    const { notification } = z
        .object({
            notification: z.object({
                id: z.string().uuid(),
                date: z.string(),
                seen: z.boolean(),
                userId: z.string()
            })
        })
        .parse(body);

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);
    await stub.removeFollowRequestAcceptedNotification(notification);

    return c.json('ok');
});

usersRoutes.post('/users/update-follow-request-accepted-notifications', async (c) => {
    const body = await c.req.json();
    const { notifications } = z
        .object({
            notifications: z.array(
                z.object({
                    id: z.string().uuid(),
                    date: z.string(),
                    seen: z.boolean(),
                    userId: z.string()
                })
            )
        })
        .parse(body);

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);

    await stub.updateFollowRequestAcceptedNotifications(notifications);

    return c.json('ok');
});

export { usersRoutes };
