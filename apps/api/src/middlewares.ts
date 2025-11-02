import { HonoContext } from 'types';
import { auth } from 'auth';
import { Context, Next } from 'hono';

export const authMiddleware = async (c: Context<HonoContext>, next: Next) => {
    if (c.req.path.startsWith('/api/auth/') || c.req.path.startsWith('/debug') || c.req.path === '/health') {
        return next();
    }

    const upgradeHeader = c.req.header('Upgrade');
    const isWebSocket = upgradeHeader?.toLowerCase() === 'websocket';

    if (isWebSocket) {
        const protocols = c.req.header('sec-websocket-protocol');

        if (protocols) {
            const protocolList = protocols.split(',').map((p) => p.trim());
            if (protocolList[0] === 'access_token' && protocolList[1]) {
                const token = decodeURIComponent(protocolList[1]);

                const headers = new Headers({
                    ...Object.fromEntries(c.req.raw.headers)
                });

                headers.delete('cookie');
                headers.set('Authorization', `Bearer ${token}`);

                const session = await auth.api.getSession({
                    headers
                });

                console.log('WS user', session);

                if (!session) {
                    return c.json({ message: 'Unauthorized' }, 401);
                }
                c.set('user', session.user);
                c.set('session', session.session);

                return next();
            }
        }
        return c.json({ message: 'Unauthorized' }, 401);
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
