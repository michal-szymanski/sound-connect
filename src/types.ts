import { z } from 'zod';

export const userDTOSchema = z.object({
    id: z.string(),
    imageUrl: z.string(),
    firstName: z.string(),
    lastName: z.string()
});

export type UserDTO = z.infer<typeof userDTOSchema>;

export const postSchema = z.object({ id: z.number(), userId: z.string(), content: z.string(), createdAt: z.string() });

export type Post = z.infer<typeof postSchema>;

export const postReactionSchema = z.object({ id: z.number(), userId: z.string() });
