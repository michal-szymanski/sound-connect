import { createServerFn } from '@tanstack/react-start';
import { envMiddleware } from '@/web/server-functions/middlewares';

export const getEnvs = createServerFn()
    .middleware([envMiddleware])
    .handler(async ({ context: { env } }) => {
        return { success: true, body: { API_URL: env.API_URL, CLIENT_URL: env.CLIENT_URL } } as const;
    });
