import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { authErrorHandler, deleteAuthCookies, failure, getSessionData, setAuthCookies, success } from '@/web/server-functions/helpers';
import { envMiddleware } from '@/web/server-functions/middlewares';
import { userSchema } from '@/common/types/drizzle';

export const getAuth = createServerFn()
    .middleware([envMiddleware])
    .handler(async ({ context: { env } }) => {
        const sessionData = await getSessionData(env);

        if (!sessionData) {
            return failure(null);
        }

        return success({ user: sessionData.user, accessToken: sessionData.accessToken });
    });

export const signIn = createServerFn({ method: 'POST' })
    .middleware([envMiddleware])
    .inputValidator(z.object({ email: z.string(), password: z.string(), rememberMe: z.boolean() }))
    .handler(async ({ data, context: { env } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/auth/sign-in/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                callbackURL: env.CLIENT_URL,
                origin: env.CLIENT_URL
            })
        });

        if (!response.ok) {
            return await authErrorHandler(response);
        }

        const authCookies = setAuthCookies(response);

        if (authCookies.length !== 2) {
            return failure(null);
        }

        try {
            const json = await response.json();
            const schema = z.object({
                user: userSchema,
                url: z.string(),
                redirect: z.boolean(),
                token: z.string()
            });

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const signOut = createServerFn({
    method: 'POST'
})
    .middleware([envMiddleware])
    .handler(async ({ context: { env } }) => {
        const { headers } = getRequest();
        const cookie = headers.get('Cookie');

        if (!cookie) {
            return failure(null);
        }

        const response = await env.API.fetch(`${env.API_URL}/api/auth/sign-out`, {
            method: 'POST',
            headers: {
                Cookie: cookie,
                Origin: env.CLIENT_URL
            },
            body: JSON.stringify({})
        });

        if (!response.ok) {
            return await authErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.object({ success: z.boolean() });
            const result = schema.parse(json);

            if (result.success) {
                deleteAuthCookies();
            }

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const signUp = createServerFn({
    method: 'POST'
})
    .middleware([envMiddleware])
    .inputValidator(z.object({ name: z.string(), email: z.string(), password: z.string() }))
    .handler(async ({ data, context: { env } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/auth/sign-up/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                callbackURL: env.CLIENT_URL,
                origin: env.CLIENT_URL
            })
        });

        if (!response.ok) {
            return await authErrorHandler(response);
        }

        const authCookies = setAuthCookies(response);

        if (authCookies.length !== 2) {
            return failure(null);
        }

        try {
            const json = await response.json();
            const schema = z.object({
                token: z.string(),
                user: userSchema
            });

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });
