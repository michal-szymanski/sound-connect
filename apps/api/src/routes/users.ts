import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import { getFollowedUsers, getUserFollowers, getUserById, unfollowUser, getContacts, followUser } from '@/api/db/queries/users-queries';
import { createNotification } from '@/api/db/queries/notifications-queries';

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

    const currentUserFollowedUsers = await getFollowedUsers(user.id);
    if (currentUserFollowedUsers.some((followed) => followed.id === userId)) {
        throw new HTTPException(400, { message: 'Already following this user' });
    }

    await followUser(user.id, userId);

    const currentUserData = await getUserById(user.id);

    await createNotification({
        userId: userId,
        type: 'follow_request',
        actorId: user.id,
        content: `${currentUserData.name} started following you`
    });

    const notificationsDO = c.env.NotificationsDO.get(c.env.NotificationsDO.idFromName(userId));
    await notificationsDO.fetch('https://notifications/send-notification', {
        method: 'POST',
        body: JSON.stringify({
            userId: userId,
            type: 'follow_request',
            actorId: user.id,
            actorName: currentUserData.name,
            content: `${currentUserData.name} started following you`
        })
    });

    return c.json({ success: true });
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

    return c.json({ status: 'none' });
});

usersRoutes.get('/users/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const user = await getUserById(userId);

    if (!user) {
        throw new HTTPException(404, { message: `User with ID ${userId} not found` });
    }

    return c.json(user);
});

export { usersRoutes };
