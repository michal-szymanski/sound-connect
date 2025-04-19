import { sessionSchema } from "@/types";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

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
