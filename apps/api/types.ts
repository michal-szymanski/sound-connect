import { auth } from 'auth';
import { CHAT_MESSAGE_MAX_LENGTH } from './constants';
import z from 'zod';

export type HonoContext = {
    Bindings: CloudflareBindings;
    Variables: {
        user: typeof auth.$Infer.Session.user;
        session: typeof auth.$Infer.Session.session;
    };
};

export const webSocketMessageTypes = z.enum(['chat', 'online-status', 'connect', 'disconnect']);

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
