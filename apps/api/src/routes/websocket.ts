import { getContacts } from '@/api/db/queries/users-queries';
import { Hono } from 'hono';
import { HonoContext } from 'types';

const websocketRoutes = new Hono<HonoContext>();

websocketRoutes.on(['GET', 'POST'], '/ws/user', async (c) => {
    const upgradeHeader = c.req.header('Upgrade');

    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return c.json({ message: 'WebSocket Upgrade Required' }, 426);
    }

    try {
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
    } catch (error) {
        console.error('Error handling WebSocket connection:', error);
        return c.json({ error }, 500);
    }
});

export { websocketRoutes };
