import { createServerFn } from '@tanstack/react-start';
import { profileSearchParamsSchema, profileSearchResponseSchema } from '@sound-connect/common/types/profile-search';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const searchProfiles = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(profileSearchParamsSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const queryParams = new URLSearchParams();

            if (data.instruments && data.instruments.length > 0) {
                data.instruments.forEach((instrument) => {
                    queryParams.append('instruments[]', instrument);
                });
            }

            if (data.genres && data.genres.length > 0) {
                data.genres.forEach((genre) => {
                    queryParams.append('genres[]', genre);
                });
            }

            if (data.city) {
                queryParams.append('city', data.city);
            }

            if (data.radius) {
                queryParams.append('radius', data.radius.toString());
            }

            if (data.availabilityStatus && data.availabilityStatus.length > 0) {
                data.availabilityStatus.forEach((status) => {
                    queryParams.append('availabilityStatus[]', status);
                });
            }

            queryParams.append('page', data.page.toString());
            queryParams.append('limit', data.limit.toString());

            const response = await env.API.fetch(`${env.API_URL}/profiles/search?${queryParams.toString()}`, {
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
            return success(profileSearchResponseSchema.parse(json));
        } catch (error) {
            console.error('searchProfiles error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
