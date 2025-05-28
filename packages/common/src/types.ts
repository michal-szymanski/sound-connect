import { CHAT_MESSAGE_MAX_LENGTH } from './constants';
import z from 'zod';

export const webSocketMessageTypes = z.enum(['chat', 'online-status', 'connect', 'disconnect', 'notification']);

export type WebSocketMessageType = z.infer<typeof webSocketMessageTypes>;

export const chatMessageSchema = z.object({
    type: z.literal(webSocketMessageTypes.Enum.chat),
    peerId: z.string(),
    text: z.string().max(CHAT_MESSAGE_MAX_LENGTH)
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const onlineStatusSchema = z.enum(['online', 'offline']);

export type OnlineStatus = z.infer<typeof onlineStatusSchema>;

export const onlineStatusMessageSchema = z.object({
    type: z.literal(webSocketMessageTypes.Enum['online-status']),
    userId: z.string(),
    status: onlineStatusSchema
});

export type OnlineStatusMessage = z.infer<typeof onlineStatusMessageSchema>;

export const webSocketMessageSchema = z.object({
    type: webSocketMessageTypes
});

export type WebSocketMessage = z.infer<typeof webSocketMessageSchema>;

export const notificationKind = z.enum(['follow-request', 'reaction']);

export const notificationMessageSchema = z.union([
    z.object({
        id: z.string().uuid(),
        type: z.literal(webSocketMessageTypes.Enum.notification),
        kind: z.literal(notificationKind.Enum['follow-request']),
        date: z.string().date(),
        seen: z.boolean(),
        accepted: z.boolean(),
        userId: z.string()
    }),
    z.object({
        id: z.string().uuid(),
        type: z.literal(webSocketMessageTypes.Enum.notification),
        kind: z.literal(notificationKind.Enum['reaction']),
        date: z.string().date(),
        seen: z.boolean(),
        userId: z.string(),
        postId: z.string()
    })
]);

export type NotificationMessage = z.infer<typeof notificationMessageSchema>;
