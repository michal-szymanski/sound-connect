import { getFollowedUsers, getUserFollowers, getUserById, followUser, unfollowUser, getMutualFollowers } from '@/api//db/queries/users-queries';
import { z } from 'zod';
import { getFeed, getPostsByUserId, getReactions } from '@/api/db/queries/posts-queries';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { HonoContext } from 'types';
import { auth } from 'auth';
import { getMessagesByUserIds } from '@/api/db/queries/messages-queries';
import { getRoomId } from '@/api/helpers';

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

app.post('/users/follow', async (c) => {
    const body = await c.req.json();
    const { userId } = z.object({ userId: z.string() }).parse(body);

    const user = c.get('user');
    await followUser(user.id, userId);

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
    const [user] = await getUserById(userId);

    if (!user) {
        return c.json(`User with ID ${userId} not found`, 404);
    }

    return c.json(user);
});

app.get('/posts/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const postsResults = await getPostsByUserId(userId);

    return c.json(postsResults);
});

app.get('/feed', async (c) => {
    const feedResults = await getFeed();

    return c.json(feedResults);
});

app.get('/posts/:postId/reactions', async (c) => {
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());
    const reactionsResults = await getReactions(postId);

    return c.json(reactionsResults);
});

app.get('/messages/:senderId/:receiverId', async (c) => {
    const { senderId, receiverId } = z
        .object({
            senderId: z.string(),
            receiverId: z.string()
        })
        .parse(c.req.param());

    const messagesResults = await getMessagesByUserIds(senderId, receiverId);

    return c.json(messagesResults);
});

app.on(['GET', 'POST'], '/ws/chat/:peerId', async (c) => {
    const upgradeHeader = c.req.header('Upgrade');

    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return c.json({ message: 'Durable Object expected Upgrade: websocket' }, { status: 426 });
    }

    try {
        const user = c.get('user');
        const peerId = c.req.param('peerId');

        if (!peerId) {
            return c.json({ message: 'Missing peerId in query parameters' }, { status: 400 });
        }

        const roomId = getRoomId(user.id, peerId);
        const id = c.env.WS.idFromName(roomId);
        const stub = c.env.WS.get(id);

        const modifiedRequest = new Request(c.req.raw, {
            headers: new Headers({
                ...Object.fromEntries(c.req.raw.headers),
                'X-User-Id': user.id
            })
        });

        return stub.fetch(modifiedRequest);
    } catch (error) {
        console.error('Error handling WebSocket connection:', error);
        return c.json({ error }, { status: 500 });
    }
});

app.get('/ws/chat/:roomId/history', async (c) => {
    const { roomId } = c.req.param();
    const user = c.get('user');

    if (!roomId.includes(user.id)) {
        return c.json({ message: 'Forbidden: You are not part of this room' }, 403);
    }

    const id = c.env.WS.idFromName(roomId);
    const stub = c.env.WS.get(id);

    const modifiedRequest = new Request(c.req.raw, {
        headers: new Headers({
            ...Object.fromEntries(c.req.raw.headers),
            'X-User-Id': user.id
        })
    });

    return stub.fetch(modifiedRequest);
});

export { WebSocketServer } from '@/api/websocket';

export default app;
