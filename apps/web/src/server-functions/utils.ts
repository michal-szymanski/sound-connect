import { env } from 'cloudflare:workers';
import { createServerFn } from '@tanstack/react-start';

export const getEnvs = createServerFn().handler(async () => {
    try {
        const { API_URL, CLIENT_URL } = env;

        return { success: true, body: { API_URL, CLIENT_URL } } as const;
    } catch (error) {
        console.error(error);
        return { success: false, body: null } as const;
    }
});
