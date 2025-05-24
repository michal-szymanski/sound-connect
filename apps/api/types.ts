import { auth } from 'auth';
import z from 'zod';
import constants from './constants';

export type HonoContext = {
    Bindings: CloudflareBindings;
    Variables: {
        user: typeof auth.$Infer.Session.user;
        session: typeof auth.$Infer.Session.session;
    };
};

export const chatMessageSchema = z.object({
    type: z.literal('chat'),
    peerId: z.string(),
    text: z.string().max(constants.CHAT_MESSAGE_MAX_LENGTH)
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
