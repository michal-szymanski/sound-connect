import { getBindings } from '@/web/lib/cloudflare-bindings';
import { createServerFn } from '@tanstack/react-start';

export const getEnvs = createServerFn().handler(async () => {
    try {
        const { API_URL, CLIENT_URL } = await getBindings();

        return { success: true, body: { API_URL, CLIENT_URL } } as const;
    } catch (error) {
        console.error(error);
        return { success: false, body: null } as const;
    }
});
