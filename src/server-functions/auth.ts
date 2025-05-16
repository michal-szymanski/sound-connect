import { getBindings } from "@/lib/cloudflare-bindings";
import {
  deleteSessionCookie,
  handleError,
  setSessionCookie,
} from "@/server-functions/helpers";
import { sessionSchema, userSchema } from "@/types";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest, getHeader } from "@tanstack/react-start/server";
import { z } from "zod";

export const getSession = createServerFn().handler(async () => {
  const { headers } = getWebRequest()!;
  const { API, API_URL } = await getBindings();

  const response = await API.fetch(`${API_URL}/api/auth/get-session`, {
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
    const { API, API_URL, CLIENT_URL } = await getBindings();

    const response = await API.fetch(`${API_URL}/api/auth/sign-in/email`, {
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

    const isCookieSet = setSessionCookie(response);

    if (!isCookieSet) return null;

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
  const { API, API_URL } = await getBindings();
  const cookie = getHeader("Cookie");

  if (!cookie) return null;

  const response = await API.fetch(`${API_URL}/api/auth/sign-out`, {
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
      deleteSessionCookie();
    }

    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
});

export const signUp = createServerFn({
  method: "POST",
})
  .validator((data: { name: string; email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { API, API_URL, CLIENT_URL } = await getBindings();

    const response = await API.fetch(`${API_URL}/api/auth/sign-up/email`, {
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

    const isCookieSet = setSessionCookie(response);

    if (!isCookieSet) return null;

    try {
      const json = await response.json();
      const schema = z.object({
        token: z.string(),
        user: userSchema,
      });

      return schema.parse(json);
    } catch (error) {
      console.error(error);
      return null;
    }
  });
