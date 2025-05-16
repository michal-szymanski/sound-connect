import { setHeader } from "@tanstack/react-start/server";

const SESSION_COOKIE_NAME = "better-auth.session_token";

export const handleError = async (response: Response) => {
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

export const setSessionCookie = (response: Response) => {
  const sessionCookie = response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(SESSION_COOKIE_NAME));

  if (!sessionCookie) {
    console.error(
      `Could not create session cookie. Headers: \n${response.headers}`
    );
    return false;
  }

  setHeader("Set-Cookie", sessionCookie);
  return true;
};

export const deleteSessionCookie = () => {
  setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`
  );
};
