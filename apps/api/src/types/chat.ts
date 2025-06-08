import { chatMessageSchema } from '@sound-connect/common/types/models';
import { z } from 'zod';

export const storedChatMessageSchema = chatMessageSchema.extend({
    id: z.string().uuid().optional(),
    roomId: z.string(),
    senderId: z.string(),
    timestamp: z.number()
});

export const newChatMessageSchema = z.object({
    type: z.literal('chat'),
    text: z.string(),
    roomId: z.string(),
    senderId: z.string()
});

export type StoredChatMessage = z.infer<typeof storedChatMessageSchema>;
export type NewChatMessage = z.infer<typeof newChatMessageSchema>;

export type UserNotificationMessage = {
    type: 'user-joined' | 'user-left';
    roomId: string;
    userId: string;
};

export type InternalMessage = StoredChatMessage | UserNotificationMessage;
