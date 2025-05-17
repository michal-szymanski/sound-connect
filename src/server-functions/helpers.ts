import { AuthError, authErrorSchema } from "@/types/auth";
import { setHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const SESSION_COOKIE_NAME = "sound-connect.session_token";
const SECURE_SESSION_COOKIE_NAME = `__Secure-${SESSION_COOKIE_NAME}`;

export const errorHandler = async (response: Response) => {
  console.error(
    `[App] Failed to fetch ${response.url} (${response.status} ${response.statusText})`
  );

  try {
    const errorBody = await response.text();

    if (errorBody.length) {
      console.error("[App] Response body:", errorBody);
    }

    const json = JSON.parse(errorBody);

    return {
      success: false,
      body: authErrorSchema.parse(json) as AuthError,
    } as const;
  } catch (e) {
    console.error("[App] Could not read response body:", e);
    return { success: false, body: null } as const;
  }
};

export const setSessionCookie = (response: Response) => {
  const sessionCookie = response.headers
    .getSetCookie()
    .find(
      (cookie) =>
        cookie.startsWith(SESSION_COOKIE_NAME) ||
        cookie.startsWith(SECURE_SESSION_COOKIE_NAME)
    );

  if (!sessionCookie) {
    console.error(
      `[App] Could not create session cookie. Cookies from /api/auth: \n${response.headers.getSetCookie()}`
    );
    return false;
  }

  setHeader("Set-Cookie", sessionCookie);
  return true;
};

export const deleteSessionCookie = () => {
  setHeader("Set-Cookie", [
    `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`,
    `${SECURE_SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`,
  ]);
};
