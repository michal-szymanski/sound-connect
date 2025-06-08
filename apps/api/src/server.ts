import { getFollowedUsers, getUserFollowers, getUserById, followUser, unfollowUser, getMutualFollowers, searchUsers } from '@/api//db/queries/users-queries';
import { z } from 'zod';
import { addPost, getFeed, getPostsByUserId, getReactions } from '@/api/db/queries/posts-queries';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { HonoContext } from 'types';
import { auth } from 'auth';
import { getRoomId } from '@sound-connect/common/helpers';
import crypto from 'crypto';
import { followRequestNotificationItem } from '@sound-connect/common/types/models';

const app = new Hono<HonoContext>();

app.use(
    '/api/auth/*',
    cors({
        origin: (_, c) => c.env.CLIENT_URL,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['POST', 'GET', 'OPTIONS'],
        exposeHeaders: ['Content-Length'],
        maxAge: 600,
        credentials: true
    })
);

app.use('*', async (c, next) => {
    if (c.req.path.startsWith('/api/auth/') || c.req.path === '/health') {
        return next();
    }

    const session = await auth.api.getSession({
        headers: c.req.raw.headers
    });

    if (!session) {
        return c.json({ message: 'Unauthorized' }, 401);
    }

    c.set('user', session.user);
    c.set('session', session.session);

    return next();
});

app.onError(({ name, message, stack, cause }, c) => {
    return c.json({ name, message, stack, cause }, 400);
});

app.notFound((c) => {
    return c.text('Not Found', 404);
});

app.get('/health', (c) => {
    return c.body('OK', 200);
});

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
    return auth.handler(c.req.raw);
});

app.get('/users/followers/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const followersResults = await getFollowedUsers(userId);

    return c.json(followersResults);
});

app.get('/users/followings/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const followingsResults = await getUserFollowers(userId);

    return c.json(followingsResults);
});

app.post('/users/send-follow-request', async (c) => {
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

app.post('/users/accept-follow-request', async (c) => {
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

    await followUser(notification.userId, user.id);
    const followedUsersByCurrentUser = await getFollowedUsers(user.id);

    if (followedUsersByCurrentUser.some((followed) => followed.id === userId)) {
        await stub.removeNotification(notification);
    } else {
        await stub.updateFollowRequestNotifications([{ ...notification, accepted: true }]);
    }

    return c.json('ok');
});

app.post('/users/delete-notification', async (c) => {
    const body = await c.req.json();
    const { notification } = z.object({ notification: followRequestNotificationItem }).parse(body);

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);
    await stub.removeNotification(notification);

    return c.json('ok');
});

app.post('/users/update-notifications', async (c) => {
    const body = await c.req.json();
    const { notifications } = z.object({ notifications: z.array(followRequestNotificationItem) }).parse(body);

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);
    await stub.updateFollowRequestNotifications(notifications);

    return c.json('ok');
});

app.post('/users/unfollow', async (c) => {
    const body = await c.req.json();
    const { userId } = z.object({ userId: z.string() }).parse(body);

    const user = c.get('user');
    await unfollowUser(user.id, userId);

    return c.json('ok');
});

app.get('/users/mutual-followers/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const usersResults = await getMutualFollowers(userId);

    return c.json(usersResults);
});

app.get('/users/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    try {
        const user = await getUserById(userId);
        return c.json(user);
    } catch (error) {
        console.error(`Error fetching user with ID ${userId}:`, error);
        return c.json(`User with ID ${userId} not found`, 404);
    }
});

app.get('/posts/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const postsResults = await getPostsByUserId(userId);

    return c.json(postsResults);
});

app.post('/posts', async (c) => {
    const body = await c.req.json();
    const { content } = z.object({ content: z.string() }).parse(body);
    const user = c.get('user');
    await addPost(user.id, content);

    return c.json('ok');
});

app.get('/feed', async (c) => {
    const feedResults = await getFeed();

    return c.json(feedResults, 200);
});

app.get('/search', async (c) => {
    const { query } = c.req.query();

    if (!query) {
        return c.json({ message: 'Query parameter is required' }, 400);
    }

    const searchResults = await searchUsers(query);

    return c.json(searchResults, 200);
});

app.get('/posts/:postId/reactions', async (c) => {
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());
    const reactionsResults = await getReactions(postId);

    return c.json(reactionsResults);
});

// Room history endpoint - now handled by ChatDO
app.get('/ws/room/:roomId/history', async (c) => {
    const { roomId } = c.req.param();
    const user = c.get('user');

    if (!roomId.includes(user.id)) {
        return c.json({ message: 'Forbidden: You are not part of this room' }, 403);
    }

    try {
        const id = c.env.ChatDO.idFromName(`room:${roomId}`);
        const stub = c.env.ChatDO.get(id);

        // Use semantic method name instead of fetch
        const history = await stub.getRoomHistory(roomId);

        return c.json(history);
    } catch (error) {
        console.error(`Error getting room history for ${roomId}:`, error);
        return c.json({ message: 'Internal Server Error' }, 500);
    }
});

app.on(['GET', 'POST'], '/ws/user', async (c) => {
    const upgradeHeader = c.req.header('Upgrade');

    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return c.json({ message: 'WebSocket Upgrade Required' }, 426);
    }

    try {
        const user = c.get('user');
        const id = c.env.UserDO.idFromName(`user:${user.id}`);
        const stub = c.env.UserDO.get(id);

        const modifiedRequest = new Request(c.req.raw, {
            headers: new Headers({
                ...Object.fromEntries(c.req.raw.headers),
                'X-User-Id': user.id
            })
        });

        return stub.fetch(modifiedRequest);
    } catch (error) {
        console.error('Error handling WebSocket connection:', error);
        return c.json({ error }, 500);
    }
});

export { ChatDurableObject } from '@/api/durable-objects/chat-durable-object';
export { UserDurableObject } from '@/api/durable-objects/user-durable-object';

export default app;
