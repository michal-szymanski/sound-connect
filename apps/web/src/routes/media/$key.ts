import { getBindings } from '@/web/lib/cloudflare-bindings';
import { createServerFileRoute } from '@tanstack/react-start/server';

export const ServerRoute = createServerFileRoute('/media/$key').methods({
    GET: async ({ params, request }) => {
        const { API_URL } = getBindings();
        const { key } = params;

        return new Response(null, {
            status: 302,
            headers: {
                ...request.headers,
                Location: `${API_URL}/media/${key}`
            }
        });
    }
});
