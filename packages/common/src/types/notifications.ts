import { entityTypeEnum, notificationSchema, notificationTypeEnum } from './drizzle';
import { z } from 'zod';

const emailVerificationMessageSchema = z.object({
    type: z.literal('email_verification'),
    userId: z.string(),
    email: z.string().email(),
    name: z.string(),
    verificationUrl: z.string().url()
});

const passwordResetMessageSchema = z.object({
    type: z.literal('password_reset'),
    userId: z.string(),
    email: z.string().email(),
    name: z.string(),
    resetUrl: z.string().url()
});

const socialNotificationMessageSchema = z.object({
    type: notificationTypeEnum,
    userId: z.string(),
    actorId: z.string(),
    actorName: z.string(),
    entityId: z.string().optional().nullable(),
    entityType: entityTypeEnum.optional().nullable(),
    content: z.string()
});

export const notificationQueueMessageSchema = z.discriminatedUnion('type', [
    emailVerificationMessageSchema,
    passwordResetMessageSchema,
    socialNotificationMessageSchema
]);

export type NotificationQueueMessage = z.infer<typeof notificationQueueMessageSchema>;
export type EmailVerificationMessage = z.infer<typeof emailVerificationMessageSchema>;
export type PasswordResetMessage = z.infer<typeof passwordResetMessageSchema>;
export type SocialNotificationMessage = z.infer<typeof socialNotificationMessageSchema>;

export const markNotificationsAsReadSchema = z.object({
    notificationIds: z.union([z.array(z.number()), z.literal('all')])
});

export type MarkNotificationsAsReadInput = z.infer<typeof markNotificationsAsReadSchema>;

export const wsNotificationInitialMessageSchema = z.object({
    type: z.literal('initial'),
    data: z.array(notificationSchema)
});

export const wsNotificationMessageSchema = z.object({
    type: z.literal('notification'),
    data: notificationSchema
});

export const wsNotificationInboundMessageSchema = z.union([wsNotificationInitialMessageSchema, wsNotificationMessageSchema]);

export type WSNotificationMessage = z.infer<typeof wsNotificationInboundMessageSchema>;
