import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const sessionSchema = z.object({
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

export const getSession = createServerFn().handler(async () => {
  const request = getWebRequest();

  if (!request?.headers) return null;

  const response = await fetch(`${process.env.BACKEND_URL}/session`, {
    headers: request.headers,
  });

  if (!response.ok) {
    return null;
  }

  const session = await response.json();
  console.log(session);
  return sessionSchema.parse(session);
});
