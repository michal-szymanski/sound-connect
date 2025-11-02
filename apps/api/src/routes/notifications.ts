import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import {
    getUserNotifications,
    markNotificationAsSeen,
    markNotificationsAsSeen,
    markAllNotificationsAsSeen,
    deleteNotification
} from '@/api/db/queries/notifications-queries';
import { markNotificationsAsReadSchema } from '@/common/types/notifications';

const notificationsRoutes = new Hono<HonoContext>();

notificationsRoutes.get('/notifications', async (c) => {
    const user = c.get('user');

    const notifications = await getUserNotifications(user.id);
    return c.json(notifications);
});

notificationsRoutes.patch('/notifications/:notificationId/seen', async (c) => {
    const { notificationId } = z.object({ notificationId: z.coerce.number().positive() }).parse(c.req.param());

    await markNotificationAsSeen(notificationId);
    return c.json({ success: true });
});

notificationsRoutes.patch('/notifications/seen', async (c) => {
    const user = c.get('user');

    await markAllNotificationsAsSeen(user.id);
    return c.json({ success: true });
});

notificationsRoutes.post('/notifications/mark-read', async (c) => {
    const user = c.get('user');

    const body = await c.req.json();
    const { notificationIds } = markNotificationsAsReadSchema.parse(body);

    if (notificationIds === 'all') {
        await markAllNotificationsAsSeen(user.id);
    } else {
        await markNotificationsAsSeen(notificationIds, user.id);
    }

    return c.json({ success: true });
});

notificationsRoutes.delete('/notifications/:notificationId', async (c) => {
    const { notificationId } = z.object({ notificationId: z.coerce.number().positive() }).parse(c.req.param());

    await deleteNotification(notificationId);
    return c.json({ success: true });
});

export { notificationsRoutes };
