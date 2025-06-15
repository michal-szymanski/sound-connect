import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import { getFollowedUsers, getUserFollowers, getUserById, unfollowUser, getContacts } from '@/api/db/queries/users-queries';
import crypto from 'crypto';

const usersRoutes = new Hono<HonoContext>();

usersRoutes.get('/users/:userId/followers', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const followersResults = await getFollowedUsers(userId);

    return c.json(followersResults);
});

usersRoutes.get('/users/:userId/followings', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const followingsResults = await getUserFollowers(userId);

    return c.json(followingsResults);
});

usersRoutes.post('/users/:userId/follow', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const user = c.get('user');

    const targetUserFollowedUsers = await getFollowedUsers(userId);
    if (targetUserFollowedUsers.some((followed) => followed.id === user.id)) {
        return c.json('Users already follow each other', 400);
    }

    const id = c.env.UserDO.idFromName(`user:${userId}`);
    const stub = c.env.UserDO.get(id);

    const notifications = await stub.getFollowRequestNotifications();

    const existingPendingNotification = notifications.find((n) => n.from === user.id && !n.accepted);
    if (existingPendingNotification) {
        return c.json('User is already notified about follow request', 400);
    }

    const currentUserId = c.env.UserDO.idFromName(`user:${user.id}`);
    const currentUserStub = c.env.UserDO.get(currentUserId);

    const currentUserNotifications = await currentUserStub.getFollowRequestNotifications();

    const acceptedNotificationFromTarget = currentUserNotifications.find((n) => n.from === userId && n.accepted);

    if (acceptedNotificationFromTarget) {
        await currentUserStub.deleteNotification(acceptedNotificationFromTarget.id);
    }

    await stub.sendFollowRequestNotification({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        seen: false,
        accepted: false,
        from: user.id,
        to: userId
    });

    return c.json('ok');
});

usersRoutes.post('/users/:userId/unfollow', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const user = c.get('user');
    await unfollowUser(user.id, userId);

    return c.json('ok');
});

usersRoutes.get('/users/:userId/contacts', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const usersResults = await getContacts(userId);

    return c.json(usersResults);
});

usersRoutes.get('/users/:userId/follow-request-status', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const user = c.get('user');

    const followedUsers = await getFollowedUsers(user.id);
    if (followedUsers.some((followed) => followed.id === userId)) {
        return c.json({ status: 'following' });
    }

    const id = c.env.UserDO.idFromName(`user:${userId}`);
    const stub = c.env.UserDO.get(id);
    const notifications = await stub.getFollowRequestNotifications();

    const pendingRequest = notifications.find((n) => n.from === user.id && !n.accepted);

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

export { usersRoutes };
