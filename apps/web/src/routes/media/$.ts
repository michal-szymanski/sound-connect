import { env } from 'cloudflare:workers';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/media/$')({
    server: {
        handlers: {
            GET: async ({ params, request }) => {
                const { API, API_URL } = env;
                const key = params._splat;

                const response = await API.fetch(`${API_URL}/api/media/${key}`, {
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
