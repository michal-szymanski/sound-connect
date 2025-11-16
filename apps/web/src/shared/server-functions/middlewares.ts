import { createMiddleware } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';
import { getSessionData, getSessionCookie } from '@/shared/server-functions/helpers';
import { Session, User } from '@/common/types/drizzle';

type Auth = {
    session: Session;
    user: User;
    cookie: string | undefined;
    accessToken: string | undefined;
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
            return await next({
                context: { env, auth: null as Auth | null }
            });
        }

        const cookie = getSessionCookie();
        const auth: Auth = {
            session: sessionData.session,
            user: sessionData.user,
            cookie,
            accessToken: sessionData.accessToken
        };

        return await next({
            context: { env, auth }
        });
    });
