import { createServerFn } from '@tanstack/react-start';
import { apiErrorHandler, success } from '@/web/server-functions/helpers';
import { authMiddleware } from '@/web/server-functions/middlewares';

export const testSentry = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/debug/test-sentry`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return success(null);
    });
