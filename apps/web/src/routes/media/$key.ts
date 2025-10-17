import { getBindings } from '@/web/lib/cloudflare-bindings';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/media/$key')({
    server: {
        handlers: {
            GET: async ({ params, request }) => {
                const { API, API_URL } = getBindings();
                const { key } = params;

                const response = await API.fetch(`${API_URL}/media/${key}`, {
                    headers: request.headers
                });

                const headers = new Headers(response.headers);
                headers.delete('content-encoding');

                return new Response(response.body, {
                    status: response.status,
                    headers
                });
            }
        }
    }
});
