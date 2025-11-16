import { createServerFn } from '@tanstack/react-start';
import { redirect } from '@tanstack/react-router';
import { bandSearchParamsSchema, bandSearchResponseSchema } from '@sound-connect/common/types/band-search';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const searchBands = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(bandSearchParamsSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        try {
            const queryParams = new URLSearchParams();

            if (data.genre) {
                queryParams.append('genre', data.genre);
            }

            if (data.city) {
                queryParams.append('city', data.city);
            }

            if (data.radius) {
                queryParams.append('radius', data.radius.toString());
            }

            if (data.lookingFor) {
                queryParams.append('lookingFor', data.lookingFor);
            }

            queryParams.append('page', data.page.toString());
            queryParams.append('limit', data.limit.toString());

            const response = await env.API.fetch(`${env.API_URL}/api/bands/search?${queryParams.toString()}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandSearchResponseSchema.parse(json));
        } catch (error) {
            console.error('searchBands error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
