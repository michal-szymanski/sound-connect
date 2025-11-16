import { createServerFn } from '@tanstack/react-start';
import { apiErrorHandler, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';
import { redirect } from '@tanstack/react-router';

export const testSentry = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

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
