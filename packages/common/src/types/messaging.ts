import { z } from 'zod';
import { appConfig } from '../app-config';
import { messageSchema } from './drizzle';

export const sendBandMessageSchema = z.object({
    content: z.string().min(1).max(appConfig.chatMessageMaxLength)
});

export const chatHistoryResponseSchema = z.array(messageSchema);

export const checkMessagingPermissionRequestSchema = z.object({
    targetUserId: z.string()
});

export const messagingPermissionReasonSchema = z.enum(['blocked', 'privacy', 'self']);

export const checkMessagingPermissionResponseSchema = z.object({
    canMessage: z.boolean(),
    reason: messagingPermissionReasonSchema.nullable()
});

export const roomIdTypeSchema = z.enum(['dm', 'band']);

export type RoomIdType = z.infer<typeof roomIdTypeSchema>;
export type SendBandMessage = z.infer<typeof sendBandMessageSchema>;
export type ChatHistoryResponse = z.infer<typeof chatHistoryResponseSchema>;
export type CheckMessagingPermissionRequest = z.infer<typeof checkMessagingPermissionRequestSchema>;
export type MessagingPermissionReason = z.infer<typeof messagingPermissionReasonSchema>;
export type CheckMessagingPermissionResponse = z.infer<typeof checkMessagingPermissionResponseSchema>;
