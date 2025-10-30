import { createMiddleware } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';
import { getSessionData, getSessionCookie } from '@/web/server-functions/helpers';
import { SessionApi, UserApi } from '@/common/types/auth';

type Auth = {
    session: SessionApi;
    user: UserApi;
    cookie: string;
};

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
    .server(async ({ next, context: { env } }) => {
        const sessionData = await getSessionData(env);

        if (!sessionData) {
            throw new Error('Unauthorized: No valid session found');
        }

        const cookie = getSessionCookie();
        const auth: Auth = {
            session: sessionData.session,
            user: sessionData.user,
            cookie: cookie ?? ''
        };

        return await next({
            context: { env, auth }
        });
    });
