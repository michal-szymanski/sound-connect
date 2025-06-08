import { CHAT_MESSAGE_MAX_LENGTH } from '@sound-connect/common/constants';
import { webSocketMessageTypes } from '@sound-connect/common/types/models';
import { z } from 'zod';

export const chatMessageSchema = z.object({
    id: z.string().uuid(),
    type: z.literal(webSocketMessageTypes.Enum.chat),
    content: z.string().max(CHAT_MESSAGE_MAX_LENGTH),
    roomId: z.string(),
    senderId: z.string(),
    timestamp: z.number()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const newChatMessageSchema = chatMessageSchema.omit({ id: true, senderId: true, timestamp: true });

export type NewChatMessage = z.infer<typeof newChatMessageSchema>;

export type UserNotificationMessage = {
    type: 'user-joined' | 'user-left';
    roomId: string;
    userId: string;
};

export type InternalMessage = ChatMessage | UserNotificationMessage;
