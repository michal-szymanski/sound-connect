import { Hono } from 'hono';
import { HonoContext } from 'types';

const chatRoutes = new Hono<HonoContext>();

chatRoutes.get('/chat/:roomId/history', async (c) => {
    const { roomId } = c.req.param();
    const user = c.get('user');

    if (!roomId.includes(user.id)) {
        return c.json({ message: 'Forbidden: You are not part of this room' }, 403);
    }

    try {
        const id = c.env.ChatDO.idFromName(`room:${roomId}`);
        const stub = c.env.ChatDO.get(id);

        const history = await stub.getRoomHistory(roomId);

        return c.json(history);
    } catch (error) {
        console.error(`[Server] Error getting room history for ${roomId}:`, error);
        return c.json({ message: 'Internal Server Error' }, 500);
    }
});

export { chatRoutes };
