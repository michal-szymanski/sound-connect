import { getBindings } from '@/web/lib/cloudflare-bindings';
import { createServerFileRoute } from '@tanstack/react-start/server';

export const ServerRoute = createServerFileRoute('/media/$key').methods({
    GET: async ({ params, request }) => {
        const { API, API_URL } = getBindings();
        const { key } = params;

        return await API.fetch(`${API_URL}/media/${key}`, {
            headers: request.headers
        });
    }
});
