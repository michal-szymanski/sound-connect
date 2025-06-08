import { HonoContext } from 'types';
import { auth } from 'auth';
import { Context, Next } from 'hono';

export const authMiddleware = async (c: Context<HonoContext>, next: Next) => {
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
};
