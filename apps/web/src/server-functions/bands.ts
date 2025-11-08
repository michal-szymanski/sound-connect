import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import {
    createBandInputSchema,
    updateBandInputSchema,
    addBandMemberInputSchema,
    bandSchema,
    bandWithMembersSchema,
    bandMemberSchema,
    userBandsResponseSchema
} from '@sound-connect/common/types/bands';
import { apiErrorHandler, failure, success } from '@/web/server-functions/helpers';
import { authMiddleware } from '@/web/server-functions/middlewares';

export const createBand = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(createBandInputSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/bands`, {
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

            const json = await response.json();
            return success(bandSchema.parse(json));
        } catch (error) {
            console.error('createBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getBand = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/bands/${data.bandId}`, {
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
            return success(bandWithMembersSchema.parse(json));
        } catch (error) {
            console.error('getBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateBand = createServerFn({ method: 'PATCH' })
    .middleware([authMiddleware])
    .inputValidator(updateBandInputSchema.extend({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const { bandId, ...updateData } = data;

            const response = await env.API.fetch(`${env.API_URL}/bands/${bandId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(updateData),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandSchema.parse(json));
        } catch (error) {
            console.error('updateBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const deleteBand = createServerFn({ method: 'DELETE' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/bands/${data.bandId}`, {
                method: 'DELETE',
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            return success(null);
        } catch (error) {
            console.error('deleteBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const addBandMember = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(addBandMemberInputSchema.extend({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const { bandId, userId } = data;

            const response = await env.API.fetch(`${env.API_URL}/bands/${bandId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify({ userId }),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandMemberSchema.parse(json));
        } catch (error) {
            console.error('addBandMember error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const removeBandMember = createServerFn({ method: 'DELETE' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number(), userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const { bandId, userId } = data;

            const response = await env.API.fetch(`${env.API_URL}/bands/${bandId}/members/${userId}`, {
                method: 'DELETE',
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            return success(null);
        } catch (error) {
            console.error('removeBandMember error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getUserBands = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/bands`, {
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
            return success(userBandsResponseSchema.parse(json));
        } catch (error) {
            console.error('getUserBands error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
