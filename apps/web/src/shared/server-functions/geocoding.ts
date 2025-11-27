import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { apiErrorHandler, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';
import { locationAutocompleteResponseSchema } from '@sound-connect/common/types/location';

export const autocompleteLocation = createServerFn({ method: 'GET' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ query: z.string().min(2).max(100) }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/geocoding/autocomplete?q=${encodeURIComponent(data.query)}`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(locationAutocompleteResponseSchema.parse(json));
    });
