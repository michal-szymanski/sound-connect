import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HonoContext } from 'types';
import { auth } from 'auth';

const authRoutes = new Hono<HonoContext>();

authRoutes.use(
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

authRoutes.on(['POST', 'GET'], '/api/auth/*', (c) => {
    return auth.handler(c.req.raw);
});

export { authRoutes };
