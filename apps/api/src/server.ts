import { getFollowers, getFollowings } from '@/api//db/queries/users-queries';
import { z } from 'zod';
import { getFeed, getPostsByUserId, getReactions } from '@/api//db/queries/posts-queries';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { HonoContext, Schema } from 'types';
import { auth } from 'auth';

const app = new Hono<HonoContext>();

app.use(
    '/health',
    cors({
        origin: (_, c) => c.env.CLIENT_URL,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['POST', 'GET', 'OPTIONS'],
        exposeHeaders: ['Content-Length'],
        maxAge: 600,
        credentials: true
    })
);

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
//     const corsMiddlewareHandler = cors({
//         origin: c.env.CLIENT_URL,
//         allowHeaders: ['Content-Type', 'Authorization'],
//         allowMethods: ['POST', 'GET', 'OPTIONS'],
//         exposeHeaders: ['Content-Length'],
//         maxAge: 600,
//         credentials: true
//     });
//     console.log(`Setting up CORS for origin: ${c.env.CLIENT_URL}`);
//     return corsMiddlewareHandler(c, next);
// });

app.use(async (c, next) => {
    const db = drizzle<Schema>(c.env.DB);
    const authInstance = auth(db, c.env);
    c.set('db', db);
    c.set('auth', authInstance);
    await next();
});

app.use('*', async (c, next) => {
    const session = await c.get('auth').api.getSession({
        headers: c.req.raw.headers
    });

    if (!session) {
        c.set('user', null);
        c.set('session', null);
        return next();
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

app.get('/followers/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param);
    const followersResults = await getFollowers(c.get('db'), userId);

    return c.json(followersResults);
});

app.get('/followings/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param);
    const followingsResults = await getFollowings(c.get('db'), userId);

    return c.json(followingsResults);
});

app.get('/posts/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param);
    const postsResults = await getPostsByUserId(c.get('db'), userId);

    return c.json(postsResults);
});

app.get('/feed', async (c) => {
    const feedResults = await getFeed(c.get('db'));

    return c.json(feedResults);
});

app.get('/posts/:postId/reactions', async (c) => {
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param);
    const reactionsResults = await getReactions(c.get('db'), postId);

    return c.json(reactionsResults);
});

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
    return c.get('auth').handler(c.req.raw);
});

app.get('/session', async (c) => {
    const session = c.get('session');
    const user = c.get('user');

    if (!user) return c.body(null, 401);

    return c.json({
        session,
        user
    });
});

app.get('/health', (c) => {
    return c.body('OK', 200);
});

export default app;
