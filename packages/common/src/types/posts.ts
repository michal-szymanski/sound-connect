import { z } from 'zod';
import { appConfig } from '../app-config';

export const createUserPostInputSchema = z.object({
    content: z.string().min(1, 'Post content is required').max(appConfig.postTextMaxLength, `Post content must be ${appConfig.postTextMaxLength} characters or less`),
    media: z
        .array(
            z.object({
                type: z.enum(['image', 'video', 'audio']),
                key: z.string()
            })
        )
        .max(appConfig.maxPostMediaCount, `Maximum ${appConfig.maxPostMediaCount} media items allowed`)
        .optional()
});

export type CreateUserPostInput = z.infer<typeof createUserPostInputSchema>;

export const postQueueMessageSchema = z.object({
    postId: z.number(),
    userId: z.string(),
    content: z.string(),
    mediaKeys: z.array(z.string()).optional()
});

export type PostQueueMessage = z.infer<typeof postQueueMessageSchema>;
