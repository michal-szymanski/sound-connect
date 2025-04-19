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

export const sessionSchema = z.object({
  session: z.object({
    id: z.string(),
    expiresAt: z.string(),
    token: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    ipAddress: z.string(),
    userAgent: z.string(),
    userId: z.string(),
  }),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    emailVerified: z.boolean(),
    image: z.string().url(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

export type Session = z.infer<typeof sessionSchema>;
