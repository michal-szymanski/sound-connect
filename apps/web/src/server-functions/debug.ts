import { createServerFn } from '@tanstack/react-start';
import { apiErrorHandler } from '@/web/server-functions/helpers';
import { authMiddleware } from '@/web/server-functions/middlewares';

export const testSentry = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/debug/test-sentry`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return { success: true, body: null } as const;
    });
