import { APP_NAME_NORMALIZED } from '@/common/constants';
import { authErrorSchema, userApiSchema, sessionApiSchema } from '@/common/types/auth';
import { getCookie, setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';

const SECURE_PREFIX = '__Secure-';
const SESSION_TOKEN_COOKIE_NAME = `${APP_NAME_NORMALIZED}.session_token`;
const SECURE_SESSION_TOKEN_COOKIE_NAME = `${SECURE_PREFIX}${SESSION_TOKEN_COOKIE_NAME}`;
const SESSION_DATA_COOKIE_NAME = `${APP_NAME_NORMALIZED}.session_data`;
const SECURE_SESSION_DATA_COOKIE_NAME = `${SECURE_PREFIX}${SESSION_DATA_COOKIE_NAME}`;

export const errorHandler = async (response: Response) => {
    try {
        const errorBody = await response.text();

        console.error(errorBody);

        const json = JSON.parse(errorBody);

        return {
            success: false,
            body: authErrorSchema.parse(json)
        } as const;
    } catch (_e) {
        return { success: false, body: null } as const;
    }
};

export const setSessionCookies = (response: Response) => {
    const sessionTokenCookie = response.headers
        .getSetCookie()
        .find((cookie) => cookie.startsWith(SESSION_TOKEN_COOKIE_NAME) || cookie.startsWith(SECURE_SESSION_TOKEN_COOKIE_NAME));

    const sessionDataCookie = response.headers
        .getSetCookie()
        .find((cookie) => cookie.startsWith(SESSION_DATA_COOKIE_NAME) || cookie.startsWith(SECURE_SESSION_DATA_COOKIE_NAME));

    setResponseHeader('Set-Cookie', [sessionTokenCookie, sessionDataCookie].filter(Boolean) as string[]);
    return true;
};

export const deleteSessionCookies = () => {
    setResponseHeader('Set-Cookie', [
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

        const schema = z.object({
            session: z.object({
                session: sessionApiSchema,
                user: userApiSchema
            }),
            expiresAt: z.number(),
            signature: z.string()
        });

        const { session } = schema.parse(json);
        return session;
    } catch (_error) {
        return null;
    }
};
