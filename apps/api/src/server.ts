import { getFollowedUsers, getUserFollowers, getUserById, followUser, unfollowUser, getMutualFollowers } from '@/api//db/queries/users-queries';
import { z } from 'zod';
import { getFeed, getPostsByUserId, getReactions } from '@/api//db/queries/posts-queries';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { HonoContext } from 'types';
import { auth } from 'auth';
import { getMessagesByUserIds } from '@/api/db/queries/messages-queries';

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

// app.use('*', async (c, next) => {
//     const session = await auth.api.getSession({
//         headers: c.req.raw.headers
//     });

//     if (!session) {
//         c.set('user', null);
//         c.set('session', null);
//         return next();
//     }

//     c.set('user', session.user);
//     c.set('session', session.session);
//     return next();
// });

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

    const session = await auth.api.getSession({
        headers: c.req.raw.headers
    });

    if (!session) {
        return c.json('Unauthorized', 401);
    }

    const { user: currentUser } = session;
    await followUser(currentUser.id, userId);

    return c.json('ok');
});

app.post('/users/unfollow', async (c) => {
    const body = await c.req.json();
    const { userId } = z.object({ userId: z.string() }).parse(body);

    const session = await auth.api.getSession({
        headers: c.req.raw.headers
    });

    if (!session) {
        return c.json('Unauthorized', 401);
    }

    const { user: currentUser } = session;
    await unfollowUser(currentUser.id, userId);

    return c.json('ok');
});

app.get('/users/mutual-followers/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const session = await auth.api.getSession({
        headers: c.req.raw.headers
    });

    if (!session) {
        return c.json('Unauthorized', 401);
    }

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

app.on(['GET', 'POST'], '/ws', async (c) => {
    const upgradeHeader = c.req.header('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return c.json({ message: 'Durable Object expected Upgrade: websocket' }, { status: 426 });
    }
    try {
        const userId = c.req.query('userId');
        const peerId = c.req.query('peerId');
        if (!userId || !peerId) {
            return c.json({ message: 'Missing userId or peerId in query parameters' }, { status: 400 });
        }
        // Use a unique room id for the pair (order-independent)
        const roomId = [userId, peerId].sort().join(':');
        const id = c.env.WS.idFromName(roomId);
        const stub = c.env.WS.get(id);
        // Forward the WebSocket upgrade request, including both userId and peerId in the query
        const url = new URL(c.req.raw.url);
        url.searchParams.set('userId', userId);
        url.searchParams.set('peerId', peerId);
        const reqWithParams = new Request(url.toString(), c.req.raw);
        return stub.fetch(reqWithParams);
    } catch (error) {
        console.error('Error handling WebSocket connection:', error);
        return c.json({ error }, { status: 500 });
    }
});

// Fix the proxy route for /ws/:roomId/history
app.get('/ws/:roomId/history', async (c) => {
    const { roomId } = c.req.param();
    const id = c.env.WS.idFromName(roomId);
    const stub = c.env.WS.get(id);
    // Use a full URL for the Durable Object fetch
    const origin = c.req.header('origin') || 'http://localhost:8787';
    const url = `${origin}/ws/${roomId}/history`;
    // Only forward Content-Type header if present
    const headers = new Headers();
    const contentType = c.req.header('content-type');
    if (contentType) {
        headers.set('content-type', contentType);
    }
    const req = new Request(url, { method: 'GET', headers });
    const resp = await stub.fetch(req);
    const body = await resp.text();
    const responseHeaders = new Headers(resp.headers);
    responseHeaders.set('Content-Type', 'application/json');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type');
    return new Response(body, { status: resp.status, headers: responseHeaders });
});

export { WebSocketServer } from '@/api/websocket';

export default app;
