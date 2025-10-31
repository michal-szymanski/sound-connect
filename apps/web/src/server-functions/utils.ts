import { createServerFn } from '@tanstack/react-start';
import { envMiddleware } from '@/web/server-functions/middlewares';
import { success } from '@/web/server-functions/helpers';

export const getEnvs = createServerFn()
    .middleware([envMiddleware])
    .handler(async ({ context: { env } }) => {
        return success({ API_URL: env.API_URL, CLIENT_URL: env.CLIENT_URL });
    });
