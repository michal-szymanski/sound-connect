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
    console.error(
      `Failed to fetch session: ${response.status} ${response.statusText}`
    );
    try {
      const errorBody = await response.text();
      console.error("Response body:", errorBody);
    } catch (e) {
      console.error("Could not read response body:", e);
    }
    return null;
  }

  const session = await response.json();
  console.log(session);
  return sessionSchema.parse(session);
});
