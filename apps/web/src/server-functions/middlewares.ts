import { createMiddleware } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';
import { userApiSchema, sessionApiSchema } from '@/common/types/auth';
import { getSessionFromCookie, getSessionCookie } from '@/web/server-functions/helpers';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';

export const envMiddleware = createMiddleware().server(async ({ next }) => {
    try {
        if (!env || !env.API || !env.API_URL) {
            console.error('[Server Functions Middleware] Cloudflare env missing required properties. API:', !!env?.API, 'API_URL:', !!env?.API_URL);
            throw new Error('Cloudflare environment not properly configured');
        }

        return await next({
            context: { env }
        });
    } catch (error) {
        console.error('[Server Functions Middleware] Failed to access Cloudflare environment:', error);
        throw new Error('Cloudflare environment not available');
    }
});

export const authMiddleware = createMiddleware()
    .middleware([envMiddleware])
    .server(async ({ next, context: { env } }) => {
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

        try {
            const json = await response.json();
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
            console.error('[Auth Middleware] Failed to parse session:', error);
            throw new Error('Unauthorized: Invalid session data');
        }
    });
