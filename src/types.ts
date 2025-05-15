import { z } from "zod";

export const userDTOSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export type UserDTO = z.infer<typeof userDTOSchema>;

export const postSchema = z.object({
  id: z.number(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export type Post = z.infer<typeof postSchema>;

export const postReactionSchema = z.object({
  id: z.number(),
  userId: z.string(),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().url().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const sessionSchema = z.object({
  id: z.string(),
  expiresAt: z.string(),
  token: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  ipAddress: z.string(),
  userAgent: z.string(),
  userId: z.string(),
});

export type Session = z.infer<typeof sessionSchema>;

export const followerSchema = z.object({ followerId: z.string() });

export type Follower = z.infer<typeof followerSchema>;

export const followingSchema = z.object({ userId: z.string() });

export type Following = z.infer<typeof followingSchema>;
