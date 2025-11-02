import { entityTypeEnum, notificationSchema, notificationTypeEnum } from './drizzle';
import { z } from 'zod';

export const notificationQueueMessageSchema = z.object({
    userId: z.string(),
    type: notificationTypeEnum,
    actorId: z.string(),
    actorName: z.string(),
    entityId: z.string().optional().nullable(),
    entityType: entityTypeEnum.optional().nullable(),
    content: z.string()
});

export type NotificationQueueMessage = z.infer<typeof notificationQueueMessageSchema>;

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
