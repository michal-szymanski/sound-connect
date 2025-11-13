import { z } from 'zod';
import { CHAT_MESSAGE_MAX_LENGTH } from '@/common/constants';

export const messageFormSchema = z.object({
    text: z.string().max(CHAT_MESSAGE_MAX_LENGTH)
});

export type MessageFormValues = z.infer<typeof messageFormSchema>;
