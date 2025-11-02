import { entityTypeEnum, notificationTypeEnum } from '@sound-connect/common/types/drizzle';
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
