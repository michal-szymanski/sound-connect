import { z } from 'zod';

export const createUserPostInputSchema = z.object({
    content: z.string().min(1, 'Post content is required').max(5000, 'Post content must be 5000 characters or less'),
    media: z
        .array(
            z.object({
                type: z.enum(['image', 'video']),
                key: z.string()
            })
        )
        .max(4, 'Maximum 4 media items allowed')
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
