import { createMiddleware } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';
import { userApiSchema, sessionApiSchema } from '@/common/types/auth';
import { getSessionFromCookie, getSessionCookie } from '@/web/server-functions/helpers';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

export const envMiddleware = createMiddleware().server(async ({ next }) => {
    if (!env || !env.API || !env.API_URL) {
        console.error('[Env Middleware] Cloudflare env missing required properties. API:', !!env?.API, 'API_URL:', !!env?.API_URL);
        throw new Error('Cloudflare environment not properly configured');
    }

    return await next({
        context: { env }
    });
});

export const authMiddleware = createMiddleware()
    .middleware([envMiddleware])
    .server(async ({ next, context: { env }, request }) => {
        const sessionFromCookie = getSessionFromCookie();

        if (sessionFromCookie) {
            const cookie = getSessionCookie();
            const auth = {
                session: sessionFromCookie.session,
                user: sessionFromCookie.user,
                cookie: cookie ?? ''
            };

            return await next({
                context: { env, auth }
            });
        }

        const { headers } = getRequest();

        const response = await env.API.fetch(`${env.API_URL}/api/auth/get-session`, {
            headers
        });

        if (!response.ok) {
            throw new Error('Unauthorized: No valid session found');
        }

        const json = await response.json();

        if (json === null) {
            throw new Error('Unauthorized: No valid session found');
        }

        try {
            const schema = z.object({ session: sessionApiSchema, user: userApiSchema });
            const data = schema.parse(json);
            const cookie = getSessionCookie();

            const auth = {
                session: data.session,
                user: data.user,
                cookie: cookie ?? ''
            };

            return await next({
                context: { env, auth }
            });
        } catch (error) {
            const isAuthRoute = [`${env.CLIENT_URL}/sign-in`, `${env.CLIENT_URL}/sign-up`].includes(request.url);

            if (!isAuthRoute) {
                console.error('[Auth Middleware] Failed to parse session:', error);
            }

            throw new Error('Unauthorized: Invalid session data');
        }
    });
