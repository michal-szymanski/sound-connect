import { z } from 'zod';

export const postQueueMessageSchema = z.object({
    postId: z.number(),
    userId: z.string(),
    content: z.string(),
    mediaKeys: z.array(z.string()).optional()
});

export type PostQueueMessage = z.infer<typeof postQueueMessageSchema>;
