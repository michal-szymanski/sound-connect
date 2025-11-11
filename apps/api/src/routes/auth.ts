import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HonoContext } from 'types';
import { createAuth } from 'auth';
import { createUserSettings } from '@/api/db/queries/settings-queries';

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

authRoutes.on(['POST', 'GET'], '/api/auth/*', async (c) => {
    const auth = createAuth({
        queue: c.env.NotificationsQueue,
        apiUrl: c.env.API_URL,
        clientUrl: c.env.CLIENT_URL,
        secret: c.env.BETTER_AUTH_SECRET
    });

    const response = await auth.handler(c.req.raw);

    if (c.req.method === 'POST' && c.req.url.includes('/sign-up/email')) {
        if (response.status === 200) {
            const clonedResponse = response.clone();
            const data = (await clonedResponse.json()) as { user?: { id: string } };

            if (data.user?.id) {
                await createUserSettings(data.user.id);
            }
        }
    }

    return response;
});

export { authRoutes };
