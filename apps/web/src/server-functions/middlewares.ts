import { createMiddleware } from '@tanstack/react-start';
import { env } from 'cloudflare:workers';

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
