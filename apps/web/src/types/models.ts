import { z } from 'zod';

export const postSchema = z.object({
    id: z.number(),
    userId: z.string(),
    content: z.string(),
    createdAt: z.string()
});

export type Post = z.infer<typeof postSchema>;

export const postReactionSchema = z.object({
    id: z.number(),
    userId: z.string()
});

export const followerSchema = z.object({ followedUserId: z.string() });

export type Follower = z.infer<typeof followerSchema>;

export const followingSchema = z.object({ userId: z.string() });

export type Following = z.infer<typeof followingSchema>;

export const messageSchema = z.object({
    id: z.string(),
    senderId: z.string(),
    receiverId: z.string(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string()
});

export type Message = z.infer<typeof messageSchema>;
