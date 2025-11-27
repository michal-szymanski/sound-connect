import { z } from 'zod';
import { appConfig } from '@sound-connect/common/app-config';

export const messageFormSchema = z.object({
    text: z.string().max(appConfig.chatMessageMaxLength)
});

export type MessageFormValues = z.infer<typeof messageFormSchema>;
