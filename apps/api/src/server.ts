import { getFollowers, getFollowings } from '@/api//db/queries/users-queries';
import { z } from 'zod';
import { getFeed, getPostsByUserId, getReactions } from '@/api//db/queries/posts-queries';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { HonoContext } from 'types';
import { auth } from 'auth';

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

app.get('/followers/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const followersResults = await getFollowers(userId);

    return c.json(followersResults);
});

app.get('/followings/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const followingsResults = await getFollowings(userId);

    return c.json(followingsResults);
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

app.on(['GET', 'POST'], '/ws', async (c) => {
    const upgradeHeader = c.req.header('Upgrade');

    if (!upgradeHeader || upgradeHeader !== 'websocket') {
        return c.json('Durable Object expected Upgrade: websocket', {
            status: 426
        });
    }

    try {
        // This example will refer to the same Durable Object,
        // since the name "foo" is hardcoded.
        let id = c.env.WS.idFromName('foo');
        let stub = c.env.WS.get(id);

        return stub.fetch(c.req.raw);
    } catch (error) {
        console.error({ error });
        return c.json({ error }, 400);
    }
});

export { WebSocketServer } from '@/api/websocket';

export default app;
