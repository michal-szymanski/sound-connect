import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { userApiSchema } from '@/common/types/auth';
import { deleteSessionCookies, errorHandler, getSessionData, setSessionCookies } from '@/web/server-functions/helpers';
import { envMiddleware } from '@/web/server-functions/middlewares';

export const getUser = createServerFn()
    .middleware([envMiddleware])
    .handler(async ({ context: { env } }) => {
        const sessionData = await getSessionData(env);

        if (!sessionData) {
            return { success: false, body: null } as const;
        }

        return { success: true, body: sessionData.user } as const;
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
            return await errorHandler(response);
        }

        const isSessionCreated = setSessionCookies(response);

        if (!isSessionCreated) {
            return { success: false, body: null } as const;
        }

        try {
            const json = await response.json();
            const schema = z.object({
                user: userApiSchema,
                url: z.string(),
                redirect: z.boolean(),
                token: z.string()
            });

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
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
            return { success: false, body: null } as const;
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
            return await errorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.object({ success: z.boolean() });
            const result = schema.parse(json);

            if (result.success) {
                deleteSessionCookies();
            }

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
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
            return await errorHandler(response);
        }

        const isSessionCreated = setSessionCookies(response);

        if (!isSessionCreated) {
            return { success: false, body: null } as const;
        }

        try {
            const json = await response.json();
            const schema = z.object({
                token: z.string(),
                user: userApiSchema
            });

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });
