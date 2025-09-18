import { getBindings } from '@/web/lib/cloudflare-bindings';
import { getSessionCookie } from '@/web/server-functions/helpers';
import { createServerFn } from '@tanstack/react-start';

export const uploadMedia = createServerFn({ method: 'POST' })
    .validator((data: FormData) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
        const cookie = getSessionCookie();

        const file = data.get('file') as File | null;

        if (!file) {
            throw new Error('No file provided');
        }

        const arrayBuffer = await file.arrayBuffer();

        const response = await API.fetch(`${API_URL}/media`, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type,
                Cookie: cookie ?? ''
            },
            body: arrayBuffer
        });

        if (!response.ok) {
            throw new Error('Failed to upload media');
        }

        return await response.json();
    });
