import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import { db } from '@/api/db';
import { users } from '@/api/db/schema';

const debugRoutes = new Hono<HonoContext>();

debugRoutes.get('/debug/user-do/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    try {
        const id = c.env.UserDO.idFromName(`user:${userId}`);
        const stub = c.env.UserDO.get(id);

        const data = await stub.getStorageForDebug();
        return c.json(data);
    } catch (error) {
        console.error(`Error accessing UserDO storage for ${userId}:`, error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

debugRoutes.get('/debug/chat-do/:roomId', async (c) => {
    const { roomId } = z.object({ roomId: z.string() }).parse(c.req.param());

    try {
        const id = c.env.ChatDO.idFromName(`room:${roomId}`);
        const stub = c.env.ChatDO.get(id);

        const data = await stub.getStorageForDebug();
        return c.json(data);
    } catch (error) {
        console.error(`Error accessing ChatDO storage for ${roomId}:`, error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

debugRoutes.delete('/debug/clear-all-notifications', async (c) => {
    try {
        const allUsers = await db.select({ id: users.id }).from(users);

        let clearedCount = 0;
        for (const user of allUsers) {
            const id = c.env.UserDO.idFromName(`user:${user.id}`);
            const stub = c.env.UserDO.get(id);
            await stub.clearAllNotifications();
            clearedCount++;
        }

        return c.json({ success: true, clearedCount, message: `Cleared notifications for ${clearedCount} users` });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

export { debugRoutes };
