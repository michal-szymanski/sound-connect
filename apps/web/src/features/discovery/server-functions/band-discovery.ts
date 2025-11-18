import { createServerFn } from '@tanstack/react-start';
import { bandDiscoveryParamsSchema, bandDiscoveryResponseSchema, discoveryAnalyticsEventSchema } from '@sound-connect/common/types/band-discovery';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const getBandDiscovery = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(bandDiscoveryParamsSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', data.page.toString());
            queryParams.append('limit', data.limit.toString());

            const response = await env.API.fetch(`${env.API_URL}/api/discover/bands?${queryParams.toString()}`, {
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
            return success(bandDiscoveryResponseSchema.parse(json));
        } catch (error) {
            console.error('getBandDiscovery error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const trackDiscoveryAnalytics = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(discoveryAnalyticsEventSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/discover/analytics/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            return success(null);
        } catch (error) {
            console.error('trackDiscoveryAnalytics error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
