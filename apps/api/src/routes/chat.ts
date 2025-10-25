import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HonoContext } from 'types';

const chatRoutes = new Hono<HonoContext>();

chatRoutes.get('/chat/:roomId/history', async (c) => {
    const { roomId } = c.req.param();
    const user = c.get('user');

    if (!roomId.includes(user.id)) {
        throw new HTTPException(403, { message: 'Forbidden: You are not part of this room' });
    }

    const id = c.env.ChatDO.idFromName(`room:${roomId}`);
    const stub = c.env.ChatDO.get(id);

    const history = await stub.getRoomHistory(roomId);

    return c.json(history);
});

export { chatRoutes };
