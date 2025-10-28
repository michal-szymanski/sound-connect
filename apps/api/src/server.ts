import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HonoContext } from 'types';
import { authMiddleware } from './middlewares';
import { authRoutes } from './routes/auth';
import { usersRoutes } from './routes/users';
import { notificationsRoutes } from './routes/notifications';
import { postsRoutes } from './routes/posts';
import { searchRoutes } from './routes/search';
import { chatRoutes } from './routes/chat';
import { websocketRoutes } from './routes/websocket';
import { debugRoutes } from './routes/debug';
import { mediaRoutes } from '@/api/routes/media';
import { commentsRoutes } from '@/api/routes/comments';
import * as Sentry from '@sentry/cloudflare';

const app = new Hono<HonoContext>();

app.use('*', authMiddleware);

app.onError((error, c) => {
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
app.route('/', usersRoutes);
app.route('/', notificationsRoutes);
app.route('/', postsRoutes);
app.route('/', searchRoutes);
app.route('/', chatRoutes);
app.route('/', websocketRoutes);
app.route('/', debugRoutes);
app.route('/', mediaRoutes);
app.route('/', commentsRoutes);

export { ChatDurableObject } from '@/api/durable-objects/chat-durable-object';
export { UserDurableObject } from '@/api/durable-objects/user-durable-object';
export { NotificationsDurableObject } from '@/api/durable-objects/notifications-durable-object';

export default Sentry.withSentry((env: CloudflareBindings) => {
    return {
        dsn: 'https://2075ba4aa31ed97ffb79114434378798@o4507454398136320.ingest.de.sentry.io/4510244218667088',
        release: env.SENTRY_RELEASE,
        sendDefaultPii: true,
        spotlight: true,
        integrations: function (integrations) {
            return integrations.filter(function (integration) {
                return integration.name !== 'Console';
            });
        }
    };
}, app);
