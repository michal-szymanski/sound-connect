import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import { getConversations } from '@/api/db/queries/conversations-queries';

const chatRoutes = new Hono<HonoContext>();

chatRoutes.get('/chat/conversations', async (c) => {
    const user = c.get('user');

    if (!user) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }

    const { limit, offset } = z
        .object({
            limit: z.coerce.number().positive().max(100).optional().default(20),
            offset: z.coerce.number().min(0).optional().default(0)
        })
        .parse({
            limit: c.req.query('limit'),
            offset: c.req.query('offset')
        });

    const result = await getConversations({
        userId: user.id,
        limit,
        offset
    });

    return c.json(result);
});

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
