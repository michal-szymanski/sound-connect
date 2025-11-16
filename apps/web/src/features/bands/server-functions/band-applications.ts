import { createServerFn } from '@tanstack/react-start';
import { redirect } from '@tanstack/react-router';
import { z } from 'zod';
import {
    createBandApplicationSchema,
    rejectBandApplicationSchema,
    submitBandApplicationResponseSchema,
    getBandApplicationsResponseSchema,
    acceptBandApplicationResponseSchema,
    rejectBandApplicationResponseSchema
} from '@sound-connect/common/types/band-applications';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const submitBandApplication = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(createBandApplicationSchema.extend({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        try {
            const { bandId, ...applicationData } = data;

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${bandId}/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(applicationData),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(submitBandApplicationResponseSchema.parse(json));
        } catch (error) {
            console.error('submitBandApplication error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getBandApplications = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(
        z.object({
            bandId: z.number(),
            status: z.enum(['pending', 'accepted', 'rejected']).optional(),
            limit: z.number().optional(),
            offset: z.number().optional()
        })
    )
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        try {
            const { bandId, ...params } = data;
            const searchParams = new URLSearchParams();
            if (params.status) searchParams.set('status', params.status);
            if (params.limit) searchParams.set('limit', params.limit.toString());
            if (params.offset) searchParams.set('offset', params.offset.toString());

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${bandId}/applications?${searchParams.toString()}`, {
                method: 'GET',
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(getBandApplicationsResponseSchema.parse(json));
        } catch (error) {
            console.error('getBandApplications error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const acceptBandApplication = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number(), applicationId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        try {
            const { bandId, applicationId } = data;

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${bandId}/applications/${applicationId}/accept`, {
                method: 'PATCH',
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(acceptBandApplicationResponseSchema.parse(json));
        } catch (error) {
            console.error('acceptBandApplication error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const rejectBandApplication = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(rejectBandApplicationSchema.extend({ bandId: z.number(), applicationId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        try {
            const { bandId, applicationId, feedbackMessage } = data;

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${bandId}/applications/${applicationId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify({ feedbackMessage }),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(rejectBandApplicationResponseSchema.parse(json));
        } catch (error) {
            console.error('rejectBandApplication error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getUserApplicationStatus = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        try {
            const { bandId } = data;

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${bandId}/application-status`, {
                method: 'GET',
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 404 || response.status === 401) {
                    return success({ hasApplied: false, isRejected: false });
                }
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            const result = z.object({ hasApplied: z.boolean(), isRejected: z.boolean() }).parse(json);

            return success(result);
        } catch (error) {
            console.error('getUserApplicationStatus error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
