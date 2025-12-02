import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { authMiddleware } from '@/shared/server-functions/middlewares';
import { success, failure, setAuthCookies, deleteAuthCookies, apiErrorHandler } from '@/shared/server-functions/helpers';

const signInInputSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1)
});

export const signIn = createServerFn({ method: 'POST' })
    .inputValidator(signInInputSchema)
    .handler(async ({ data }) => {
        const API_URL = 'http://localhost:4000';

        const response = await fetch(`${API_URL}/api/auth/sign-in/username`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        setAuthCookies(response);

        const json = (await response.json()) as { user: { role?: string | null } };

        if (json.user.role !== 'admin') {
            deleteAuthCookies();
            return failure({
                status: 403,
                message:
                    json.user.role === undefined || json.user.role === null
                        ? 'Unauthorized: Role field missing. Please restart the API server.'
                        : 'Unauthorized: Admin access required'
            });
        }

        return success({});
    });

export const getAdminSession = createServerFn({ method: 'GET' })
    .middleware([authMiddleware])
    .handler(async ({ context: { auth } }) => {
        if (auth.user.role !== 'admin') {
            return failure({
                status: 403,
                message:
                    auth.user.role === undefined || auth.user.role === null
                        ? 'Unauthorized: Role field missing. Please restart the API server.'
                        : 'Unauthorized: Admin access required'
            });
        }

        return success({ user: auth.user });
    });

export const signOut = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/auth/sign-out`, {
            method: 'POST',
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });

        deleteAuthCookies();

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return success(null);
    });
