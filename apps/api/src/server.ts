import { Hono } from 'hono';
import { HonoContext } from 'types';
import { authMiddleware } from './middlewares';
import { authRoutes } from './routes/auth';
import { usersRoutes } from './routes/users';
import { postsRoutes } from './routes/posts';
import { searchRoutes } from './routes/search';
import { chatRoutes } from './routes/chat';
import { websocketRoutes } from './routes/websocket';

const app = new Hono<HonoContext>();

app.use('*', authMiddleware);

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
