import { notificationsTable, userSettingsTable } from '@/drizzle/schema';
import type { NotificationQueueMessage, SocialNotificationMessage } from '@sound-connect/common/types/notifications';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { sendVerificationEmail, sendPasswordResetEmail } from './email-service';

type UserSettingsRow = typeof userSettingsTable.$inferSelect;

const getNotificationSettingField = (notificationType: string): keyof UserSettingsRow => {
    switch (notificationType) {
        case 'follow_request':
        case 'follow_accepted':
            return 'followNotifications';
        case 'comment':
            return 'commentNotifications';
        case 'reaction':
            return 'reactionNotifications';
        case 'mention':
            return 'mentionNotifications';
        case 'band_application_received':
            return 'bandApplicationNotifications';
        case 'band_application_accepted':
        case 'band_application_rejected':
            return 'bandResponseNotifications';
        default:
            return 'emailEnabled';
    }
};

const sendEmailNotification = async (userId: string, notificationType: string, content: string, actorName: string): Promise<void> => {
    console.log(`[EMAIL] Would send email to user ${userId}:`);
    console.log(`  Type: ${notificationType}`);
    console.log(`  From: ${actorName}`);
    console.log(`  Content: ${content}`);
};

const processSocialNotification = async (message: SocialNotificationMessage, env: CloudflareBindings): Promise<void> => {
    console.log(`Processing social notification for user ${message.userId}, type: ${message.type}`);

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

    const [settings] = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, message.userId)).limit(1);

    if (!settings) {
        console.warn(`No settings found for user ${message.userId}, creating default settings`);

        await db.insert(userSettingsTable).values({
            userId: message.userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        await sendEmailNotification(message.userId, message.type, message.content, message.actorName);

        console.log(`Email notification sent to user ${message.userId} (default settings)`);
        return;
    }

    if (!settings.emailEnabled) {
        console.log(`Email notifications globally disabled for user ${message.userId}`);
        return;
    }

    const settingField = getNotificationSettingField(message.type);
    const notificationTypeEnabled = Boolean(settings[settingField]);

    if (!notificationTypeEnabled) {
        console.log(`${message.type} email notifications disabled for user ${message.userId}`);
        return;
    }

    await sendEmailNotification(message.userId, message.type, message.content, message.actorName);

    console.log(`Email notification sent to user ${message.userId}`);
};

export const processNotification = async (message: NotificationQueueMessage, env: CloudflareBindings): Promise<void> => {
    if (message.type === 'email_verification') {
        console.log(`Processing email verification for user ${message.userId}`);
        await sendVerificationEmail(message, env.RESEND_API_KEY);
        return;
    }

    if (message.type === 'password_reset') {
        console.log(`Processing password reset for user ${message.userId}`);
        await sendPasswordResetEmail(message, env.RESEND_API_KEY);
        return;
    }

    await processSocialNotification(message, env);
};
