import { Hono } from 'hono';
import { HonoContext } from 'types';
import { auth } from 'auth';
import { authRoutes } from './routes/auth';
import { usersRoutes } from './routes/users';
import { postsRoutes } from './routes/posts';
import { searchRoutes } from './routes/search';
import { chatRoutes } from './routes/chat';
import { websocketRoutes } from './routes/websocket';

const app = new Hono<HonoContext>();

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

app.route('/', authRoutes);
app.route('/', usersRoutes);
app.route('/', postsRoutes);
app.route('/', searchRoutes);
app.route('/', chatRoutes);
app.route('/', websocketRoutes);

export { ChatDurableObject } from '@/api/durable-objects/chat-durable-object';
export { UserDurableObject } from '@/api/durable-objects/user-durable-object';

export default app;
