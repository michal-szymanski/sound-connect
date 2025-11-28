import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { authMiddleware } from '@/shared/server-functions/middlewares';
import { success, failure, apiErrorHandler } from '@/shared/server-functions/helpers';
import {
    musicSamplesListSchema,
    createMusicSampleSchema,
    updateMusicSampleSchema,
    reorderMusicSamplesSchema,
    musicSampleSchema
} from '@sound-connect/common/types/music-samples';

export const getMusicSamples = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ context: { env, auth }, data }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/${data.userId}/music-samples`, {
                method: 'GET',
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
            return success(musicSamplesListSchema.parse(json));
        } catch (error) {
            console.error('getMusicSamples error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const createMusicSample = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(createMusicSampleSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/music-samples`, {
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
            return success(musicSampleSchema.parse(json));
        } catch (error) {
            console.error('createMusicSample error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateMusicSample = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ id: z.number() }).merge(updateMusicSampleSchema))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const { id, ...updates } = data;
            const response = await env.API.fetch(`${env.API_URL}/api/users/music-samples/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(updates),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(musicSampleSchema.parse(json));
        } catch (error) {
            console.error('updateMusicSample error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const deleteMusicSample = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ id: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/music-samples/${data.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            return success(undefined);
        } catch (error) {
            console.error('deleteMusicSample error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const reorderMusicSamples = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(reorderMusicSamplesSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/music-samples/reorder`, {
                method: 'PATCH',
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

            return success(undefined);
        } catch (error) {
            console.error('reorderMusicSamples error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
