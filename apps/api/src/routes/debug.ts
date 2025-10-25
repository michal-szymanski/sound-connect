import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import { db } from '@/api/db';
import { schema } from '@/drizzle';

const { users } = schema;

const debugRoutes = new Hono<HonoContext>();

debugRoutes.get('/debug/user-do/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    try {
        const id = c.env.UserDO.idFromName(`user:${userId}`);
        const stub = c.env.UserDO.get(id);

        const data = await stub.getStorageForDebug();
        return c.json(data);
    } catch (_error) {
        throw new HTTPException(500, { message: 'Internal server error' });
    }
});

debugRoutes.get('/debug/chat-do/:roomId', async (c) => {
    const { roomId } = z.object({ roomId: z.string() }).parse(c.req.param());

    try {
        const id = c.env.ChatDO.idFromName(`room:${roomId}`);
        const stub = c.env.ChatDO.get(id);

        const data = await stub.getStorageForDebug();
        return c.json(data);
    } catch (_error) {
        throw new HTTPException(500, { message: 'Internal server error' });
    }
});

debugRoutes.delete('/debug/clear-all-notifications', async (c) => {
    try {
        const allUsers = await db.select({ id: users.id }).from(users);

        let clearedCount = 0;
        for (const user of allUsers) {
            const id = c.env.UserDO.idFromName(`user:${user.id}`);
            const stub = c.env.UserDO.get(id);
            await stub.resetUserState();
            clearedCount++;
        }

        return c.json({ success: true, clearedCount, message: `Reset state for ${clearedCount} users (notifications, subscribers, chat rooms)` });
    } catch (_error) {
        throw new HTTPException(500, { message: 'Internal server error' });
    }
});

export { debugRoutes };
