import { APP_NAME_NORMALIZED } from '@/common/constants';
import { authErrorSchema, userApiSchema, sessionApiSchema, SessionApi, UserApi } from '@/common/types/auth';
import { apiErrorSchema } from '@/common/types/api';
import type { ServerFunctionError, ServerFunctionSuccess } from '@/common/types/server-functions';
import { getCookie, getRequest, setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';

const SECURE_PREFIX = '__Secure-';
const SESSION_TOKEN_COOKIE_NAME = `${APP_NAME_NORMALIZED}.session_token`;
const SECURE_SESSION_TOKEN_COOKIE_NAME = `${SECURE_PREFIX}${SESSION_TOKEN_COOKIE_NAME}`;
const SESSION_DATA_COOKIE_NAME = `${APP_NAME_NORMALIZED}.session_data`;
const SECURE_SESSION_DATA_COOKIE_NAME = `${SECURE_PREFIX}${SESSION_DATA_COOKIE_NAME}`;

type SessionData = {
    session: SessionApi;
    user: UserApi;
};

export const success = <T>(body: T): ServerFunctionSuccess<T> => {
    return { success: true, body };
};

export const failure = <E = null>(body: E): ServerFunctionError<E> => {
    return { success: false, body };
};

export const authErrorHandler = async (response: Response) => {
    try {
        const status = response.status;
        const errorBody = await response.text();

        console.error(errorBody);

        const json = JSON.parse(errorBody);
        const authError = authErrorSchema.parse(json);

        return failure({ ...authError, status });
    } catch (error) {
        console.error(error);
        return failure(null);
    }
};

export const apiErrorHandler = async (response: Response) => {
    try {
        const status = response.status;
        const errorBody = await response.text();

        console.error(errorBody);

        let message: string;

        try {
            const json = JSON.parse(errorBody);
            const parsed = apiErrorSchema.parse(json);
            message = parsed.message;
        } catch {
            message = errorBody;
        }

        return failure({ status, message });
    } catch (error) {
        console.error(error);
        return failure(null);
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

export const getSessionDataFromCookie = (): SessionData | null => {
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
    } catch {
        return null;
    }
};

export const getSessionData = async (env: Cloudflare.Env): Promise<SessionData | null> => {
    try {
        let sessionData = getSessionDataFromCookie();

        if (!sessionData) {
            const { headers } = getRequest();
            const response = await env.API.fetch(`${env.API_URL}/api/auth/get-session`, {
                headers
            });

            if (response.ok) {
                const json = await response.json();

                if (json !== null) {
                    const schema = z.object({ session: sessionApiSchema, user: userApiSchema });
                    sessionData = schema.parse(json);
                }
            }
        }

        return sessionData;
    } catch {
        return null;
    }
};
