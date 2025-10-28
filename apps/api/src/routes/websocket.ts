import { getContacts } from '@/api/db/queries/users-queries';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HonoContext } from 'types';

const websocketRoutes = new Hono<HonoContext>();

websocketRoutes.on(['GET', 'POST'], '/ws/user', async (c) => {
    const upgradeHeader = c.req.header('Upgrade');

    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        throw new HTTPException(426, { message: 'WebSocket Upgrade Required' });
    }

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);
    const contacts = await getContacts(user.id);
    await stub.initializeSubscribers(contacts);

    const modifiedRequest = new Request(c.req.raw, {
        headers: new Headers({
            ...Object.fromEntries(c.req.raw.headers),
            'X-User-Id': user.id
        })
    });

    return stub.fetch(modifiedRequest);
});

websocketRoutes.on(['GET', 'POST'], '/ws/notifications', async (c) => {
    const upgradeHeader = c.req.header('Upgrade');

    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        throw new HTTPException(426, { message: 'WebSocket Upgrade Required' });
    }

    const user = c.get('user');
    const id = c.env.NotificationsDO.idFromName('notifications:global');
    const stub = c.env.NotificationsDO.get(id);

    const modifiedRequest = new Request(c.req.raw, {
        headers: new Headers({
            ...Object.fromEntries(c.req.raw.headers),
            'X-User-Id': user.id
        })
    });

    return stub.fetch(modifiedRequest);
});

export { websocketRoutes };
