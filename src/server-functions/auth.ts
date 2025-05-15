import { getBindings } from "@/lib/cloudflare-bindings";
import { handleError } from "@/server-functions/helpers";
import { sessionSchema, userSchema } from "@/types";
import { createServerFn } from "@tanstack/react-start";
import {
  getWebRequest,
  setHeader,
  getHeader,
} from "@tanstack/react-start/server";
import { z } from "zod";

const COOKIE_NAME = "better-auth.session_token";

export const getSession = createServerFn().handler(async () => {
  const { headers } = getWebRequest()!;
  const { BACKEND_URL } = await getBindings();

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

    const sessionCookie = response.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith(COOKIE_NAME));

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

export const signOut = createServerFn({
  method: "POST",
}).handler(async () => {
  const { BACKEND_URL } = await getBindings();
  const cookie = getHeader("Cookie");

  if (!cookie) return null;

  const response = await fetch(`${BACKEND_URL}/api/auth/sign-out`, {
    method: "POST",
    headers: {
      Cookie: cookie,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    await handleError(response);
    return null;
  }

  try {
    const json = await response.json();
    const schema = z.object({ success: z.boolean() });
    const result = schema.parse(json);

    if (result.success) {
      setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`
      );
    }

    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
});
