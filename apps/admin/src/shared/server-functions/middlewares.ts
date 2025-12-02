import { createMiddleware } from '@tanstack/react-start';
import { redirect } from '@tanstack/react-router';
import { env } from 'cloudflare:workers';
import { getSessionData, getSessionCookie } from '@/shared/server-functions/helpers';
import { Session, User } from '@/common/types/drizzle';

type Auth = {
    session: Session;
    user: User;
    cookie: string | undefined;
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
            throw new Error('UNAUTHORIZED');
        }

        const cookie = getSessionCookie();
        const auth: Auth = {
            session: sessionData.session,
            user: sessionData.user,
            cookie
        };

        return await next({
            context: { env, auth }
        });
    });

export const adminAuthMiddleware = createMiddleware()
    .middleware([authMiddleware])
    .server(async ({ next, context: { env, auth } }) => {
        if (auth.user.role !== 'admin') {
            console.error('[Admin Auth] User role check failed:', { role: auth.user.role, userId: auth.user.id });
            throw redirect({ to: '/login' });
        }

        return await next({
            context: { env, auth }
        });
    });
