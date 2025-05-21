import { authErrorSchema, sessionSchema, userSchema } from '@/web/types/auth';
import { getCookie, setHeader } from '@tanstack/react-start/server';
import { z } from 'zod';

const SECURE_PREFIX = '__Secure-';
const SESSION_TOKEN_COOKIE_NAME = 'sound-connect.session_token';
const SECURE_SESSION_TOKEN_COOKIE_NAME = `${SECURE_PREFIX}${SESSION_TOKEN_COOKIE_NAME}`;
const SESSION_DATA_COOKIE_NAME = 'sound-connect.session_data';
const SECURE_SESSION_DATA_COOKIE_NAME = `${SECURE_PREFIX}${SESSION_DATA_COOKIE_NAME}`;

export const errorHandler = async (response: Response) => {
    console.error(`[App] Failed to fetch ${response.url} (${response.status} ${response.statusText})`);

    try {
        const errorBody = await response.text();

        if (errorBody.length) {
            console.error('[App] Response body:', errorBody);
        }

        const json = JSON.parse(errorBody);

        return {
            success: false,
            body: authErrorSchema.parse(json)
        } as const;
    } catch (e) {
        console.error('[App] Could not read response body:', e);
        return { success: false, body: null } as const;
    }
};

export const setSessionCookies = (response: Response) => {
    const sessionTokenCookie = response.headers
        .getSetCookie()
        .find((cookie) => cookie.startsWith(SESSION_TOKEN_COOKIE_NAME) || cookie.startsWith(SECURE_SESSION_TOKEN_COOKIE_NAME));

    // if (!sessionTokenCookie) {
    //     console.error(`[App] Could not create session cookie. Cookies from /api/auth: \n${response.headers.getSetCookie()}`);
    //     return false;
    // }

    const sessionDataCookie = response.headers
        .getSetCookie()
        .find((cookie) => cookie.startsWith(SESSION_DATA_COOKIE_NAME) || cookie.startsWith(SECURE_SESSION_DATA_COOKIE_NAME));

    setHeader('Set-Cookie', [sessionTokenCookie, sessionDataCookie]);
    return true;
};

export const deleteSessionCookies = () => {
    setHeader('Set-Cookie', [
        `${SESSION_TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`,
        `${SECURE_SESSION_TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`,
        `${SESSION_DATA_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`,
        `${SECURE_SESSION_DATA_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`
    ]);
};

export const getSessionCookie = () => {
    const secureSessionTokenCookie = getCookie(SECURE_SESSION_TOKEN_COOKIE_NAME);

    if (secureSessionTokenCookie) {
        return `${SECURE_SESSION_TOKEN_COOKIE_NAME}=${secureSessionTokenCookie}`;
    }

    const sessionTokenCookie = getCookie(SESSION_TOKEN_COOKIE_NAME);

    if (sessionTokenCookie) {
        return `${SESSION_TOKEN_COOKIE_NAME}=${sessionTokenCookie}`;
    }

    return null;
};

export const getSessionFromCookie = () => {
    try {
        const cookieValue = getCookie(SECURE_SESSION_DATA_COOKIE_NAME) ?? getCookie(SESSION_DATA_COOKIE_NAME);

        if (!cookieValue) return null;

        const decodedValue = Buffer.from(cookieValue, 'base64').toString('utf-8');
        const json = JSON.parse(decodedValue);
        const schema = z.object({ session: z.object({ session: sessionSchema, user: userSchema }), expiresAt: z.number(), signature: z.string() });
        const { session } = schema.parse(json);
        return session;
    } catch (error) {
        return null;
    }
};
