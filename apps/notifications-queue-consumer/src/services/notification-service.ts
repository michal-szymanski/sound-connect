import { notificationsTable } from '@/drizzle/schema';
import type { NotificationQueueMessage } from '../types';
import { db } from '../db';

export const processNotification = async (message: NotificationQueueMessage, env: CloudflareBindings): Promise<void> => {
    console.log(`Processing notification for user ${message.userId}, type: ${message.type}`);

    const createdAt = new Date().toISOString();

    const [notification] = await db
        .insert(notificationsTable)
        .values({
            userId: message.userId,
            type: message.type,
            actorId: message.actorId,
            entityId: message.entityId ?? null,
            entityType: message.entityType ?? null,
            content: message.content,
            seen: false,
            createdAt
        })
        .returning();

    if (!notification) {
        throw new Error('Failed to create notification in database');
    }

    console.log(`Notification saved to database with ID: ${notification.id}`);

    const notificationsDO = env.NotificationsDO.get(env.NotificationsDO.idFromName('notifications:global'));

    await notificationsDO.fetch('https://notifications/send-notification-realtime', {
        method: 'POST',
        body: JSON.stringify({
            userId: message.userId,
            notification: {
                ...notification,
                actorName: message.actorName
            }
        })
    });

    console.log(`Real-time notification sent to user ${message.userId}`);
};
