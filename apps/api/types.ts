import { auth } from 'auth';
import z from 'zod';
import constants from './constants';

export type HonoContext = {
    Bindings: CloudflareBindings;
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null;
    };
};

export const chatMessageSchema = z.object({
    type: z.literal('chat'),
    senderId: z.string(),
    receiverId: z.string(),
    text: z.string().max(constants.CHAT_MESSAGE_MAX_LENGTH)
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
