import { getBindings } from "@/lib/cloudflare-bindings";
import { sessionSchema, userSchema } from "@/types";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest, setHeader } from "@tanstack/react-start/server";
import { z } from "zod";

export const getSession = createServerFn().handler(async () => {
  const { headers } = getWebRequest()!;
  const { BACKEND_URL } = await getBindings();

  if (!headers) return null;

  const response = await fetch(`${BACKEND_URL}/api/auth/get-session`, {
    headers,
  });

  if (!response.ok) {
    await handleError(response);
    return null;
  }

  try {
    const text = await response.text();

    if (!text) return null;

    const json = JSON.parse(text);
    const schema = z.object({ session: sessionSchema, user: userSchema });

    return schema.parse(json);
  } catch (error) {
    console.error(error);
    return null;
  }
});

export const signIn = createServerFn({ method: "POST" })
  .validator(
    (data: { email: string; password: string; rememberMe: boolean }) => data
  )
  .handler(async ({ data }) => {
    const { BACKEND_URL, CLIENT_URL } = await getBindings();

    const response = await fetch(`${BACKEND_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        callbackURL: CLIENT_URL,
      }),
    });

    if (!response.ok) {
      await handleError(response);
      return null;
    }

    const cookieName = "better-auth.session_token";
    const sessionCookie = response.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith(cookieName));

    if (!sessionCookie) return null;

    setHeader("Set-Cookie", sessionCookie);

    try {
      const json = await response.json();
      const schema = z.object({
        user: userSchema,
        url: z.string(),
        redirect: z.boolean(),
        token: z.string(),
      });

      return schema.parse(json);
    } catch (error) {
      console.error(error);
      return null;
    }
  });

const handleError = async (response: Response) => {
  console.error(
    `Failed to fetch ${response.url} (${response.status} ${response.statusText})`
  );
  try {
    const errorBody = await response.text();
    if (errorBody.length) {
      console.error("Response body:", errorBody);
    }
  } catch (e) {
    console.error("Could not read response body:", e);
  }
};
