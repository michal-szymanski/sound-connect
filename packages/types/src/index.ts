import z from 'zod';

export const chatMessageSchema = z.object({
    type: z.literal('chat'),
    senderId: z.string(),
    receiverId: z.string(),
    text: z.string()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
