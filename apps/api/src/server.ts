import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { HonoContext } from 'types';
import { authMiddleware } from './middlewares';
import { authRoutes } from './routes/auth';
import { usersRoutes } from './routes/users';
import { postsRoutes } from './routes/posts';
import { searchRoutes } from './routes/search';
import { chatRoutes } from './routes/chat';
import { websocketRoutes } from './routes/websocket';
import { debugRoutes } from './routes/debug';
import { mediaRoutes } from '@/api/routes/media';
import { commentsRoutes } from '@/api/routes/comments';
import { notificationsRoutes } from '@/api/routes/notifications';
import { profileRoutes } from '@/api/routes/profile';
import { bandsRoutes } from '@/api/routes/bands';
import { uploadsRoutes } from '@/api/routes/uploads';
import { settingsRoutes } from '@/api/routes/settings';
import { discoverRoutes } from '@/api/routes/discover';
import { onboardingRoutes } from '@/api/routes/onboarding';
import * as Sentry from '@sentry/cloudflare';

const app = new Hono<HonoContext>();

app.use(
    '*',
    cors({
        origin: (_, c) => c.env.CLIENT_URL,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        exposeHeaders: ['Content-Length'],
        maxAge: 600,
        credentials: true
    })
);

app.use('*', authMiddleware);

app.onError((error, c) => {
    console.error(error);
    if (error instanceof HTTPException) {
        return error.getResponse();
    }
    return c.text('Internal Server Error', 500);
});

app.notFound((c) => {
    return c.text('Not Found', 404);
});

app.get('/health', (c) => {
    return c.body('OK', 200);
});

app.route('/', authRoutes);
app.route('/api', usersRoutes);
app.route('/api', postsRoutes);
app.route('/api', searchRoutes);
app.route('/api', chatRoutes);
app.route('/api', websocketRoutes);
app.route('/api', debugRoutes);
app.route('/api', mediaRoutes);
app.route('/api', commentsRoutes);
app.route('/api', notificationsRoutes);
app.route('/api', profileRoutes);
app.route('/api', bandsRoutes);
app.route('/api', uploadsRoutes);
app.route('/api', settingsRoutes);
app.route('/api', discoverRoutes);
app.route('/api', onboardingRoutes);

export { ChatDurableObject, UserDurableObject, NotificationsDurableObject } from '@sound-connect/durable-objects';

export default Sentry.withSentry((env: CloudflareBindings) => {
    const { id: versionId } = env.CF_VERSION_METADATA;
    return {
        dsn: 'https://2075ba4aa31ed97ffb79114434378798@o4507454398136320.ingest.de.sentry.io/4510244218667088',
        release: versionId,
        sendDefaultPii: true,
        spotlight: true,
        integrations: function (integrations) {
            return integrations.filter(function (integration) {
                return integration.name !== 'Console';
            });
        }
    };
}, app);
