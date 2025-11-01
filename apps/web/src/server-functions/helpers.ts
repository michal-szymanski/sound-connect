import { APP_NAME_NORMALIZED } from '@/common/constants';
import { authErrorSchema } from '@/common/types/auth';
import { apiErrorSchema } from '@/common/types/api';
import type { ServerFunctionError, ServerFunctionSuccess } from '@/common/types/server-functions';
import { getCookie, getRequest, setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { Session, sessionSchema, User, userSchema } from '@/common/types/drizzle';

const SECURE_PREFIX = '__Secure-';
const SESSION_TOKEN_COOKIE_NAME = `${APP_NAME_NORMALIZED}.session_token`;
const SECURE_SESSION_TOKEN_COOKIE_NAME = `${SECURE_PREFIX}${SESSION_TOKEN_COOKIE_NAME}`;
const SESSION_DATA_COOKIE_NAME = `${APP_NAME_NORMALIZED}.session_data`;
const SECURE_SESSION_DATA_COOKIE_NAME = `${SECURE_PREFIX}${SESSION_DATA_COOKIE_NAME}`;
const ACCESS_TOKEN_COOKIE_NAME = `${APP_NAME_NORMALIZED}.access_token`;
const SECURE_ACCESS_TOKEN_COOKIE_NAME = `${SECURE_PREFIX}${ACCESS_TOKEN_COOKIE_NAME}`;
const ACCESS_TOKEN_MAX_AGE = 900;

type SessionData = {
    session: Session;
    user: User;
    accessToken: string | undefined;
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
        const text = await response.text();

        if (!text) {
            console.error('Empty response body from auth endpoint');
            return failure(null);
        }

        let json;
        try {
            json = JSON.parse(text);
        } catch {
            console.error('Failed to parse auth error response as JSON:', text);
            return failure(null);
        }

        console.error('Auth error:', json);

        const authError = authErrorSchema.parse(json);

        return failure({ ...authError, status });
    } catch (error) {
        console.error('Unexpected error in authErrorHandler:', error);
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

export const setAuthCookies = (response: Response) => {
    const sessionTokenCookie = response.headers
        .getSetCookie()
        .find((cookie) => cookie.startsWith(SESSION_TOKEN_COOKIE_NAME) || cookie.startsWith(SECURE_SESSION_TOKEN_COOKIE_NAME));

    const sessionDataCookie = response.headers
        .getSetCookie()
        .find((cookie) => cookie.startsWith(SESSION_DATA_COOKIE_NAME) || cookie.startsWith(SECURE_SESSION_DATA_COOKIE_NAME));

    const accessToken = response.headers.get('set-auth-token');

    const cookies = [sessionTokenCookie, sessionDataCookie].filter(Boolean) as string[];

    if (accessToken) {
        cookies.push(
            `${SECURE_ACCESS_TOKEN_COOKIE_NAME}=${accessToken}; Max-Age=${ACCESS_TOKEN_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`
        );
    }

    setResponseHeader('Set-Cookie', cookies);
    return cookies;
};

export const deleteAuthCookies = () => {
    setResponseHeader('Set-Cookie', [
        `${SESSION_TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`,
        `${SECURE_SESSION_TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`,
        `${SESSION_DATA_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`,
        `${SECURE_SESSION_DATA_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`,
        `${ACCESS_TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`,
        `${SECURE_ACCESS_TOKEN_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`
    ]);
};

export const getSessionCookie = (): string | undefined => {
    const secureSessionTokenCookie = getCookie(SECURE_SESSION_TOKEN_COOKIE_NAME);

    if (secureSessionTokenCookie) {
        return `${SECURE_SESSION_TOKEN_COOKIE_NAME}=${secureSessionTokenCookie}`;
    }

    const sessionTokenCookie = getCookie(SESSION_TOKEN_COOKIE_NAME);

    if (sessionTokenCookie) {
        return `${SESSION_TOKEN_COOKIE_NAME}=${sessionTokenCookie}`;
    }

    return undefined;
};

export const getAccessToken = (): string | undefined => {
    const secureAccessToken = getCookie(SECURE_ACCESS_TOKEN_COOKIE_NAME);

    if (secureAccessToken) {
        return secureAccessToken;
    }

    const accessToken = getCookie(ACCESS_TOKEN_COOKIE_NAME);

    if (accessToken) {
        return accessToken;
    }

    return undefined;
};

export const getSessionDataFromCookie = (): SessionData | null => {
    try {
        const cookieValue = getCookie(SECURE_SESSION_DATA_COOKIE_NAME) ?? getCookie(SESSION_DATA_COOKIE_NAME);

        if (!cookieValue) return null;

        const decodedValue = Buffer.from(cookieValue, 'base64').toString('utf-8');
        const json = JSON.parse(decodedValue);

        const schema = z.object({
            session: z.object({
                session: sessionSchema,
                user: userSchema
            }),
            expiresAt: z.number(),
            signature: z.string()
        });

        const { session } = schema.parse(json);
        const accessToken = getAccessToken();
        return { ...session, accessToken };
    } catch (error) {
        console.error('Error getting session data from cookie', error);
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
                    const schema = z.object({ session: sessionSchema, user: userSchema });
                    const data = schema.parse(json);
                    const accessToken = response.headers.get('set-auth-token') ?? undefined;
                    sessionData = { ...data, accessToken };
                }
            }
        }

        return sessionData;
    } catch {
        return null;
    }
};
