import { chatMessageSchema } from '@sound-connect/common/types/models';
import { z } from 'zod';

export const storedChatMessageSchema = chatMessageSchema.extend({
    id: z.string().uuid().optional(),
    roomId: z.string(),
    senderId: z.string(),
    timestamp: z.number()
});

export type StoredChatMessage = z.infer<typeof storedChatMessageSchema>;

export type UserNotificationMessage = {
    type: 'user-joined' | 'user-left';
    roomId: string;
    userId: string;
};

export type InternalMessage = StoredChatMessage | UserNotificationMessage;
