import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { authMiddleware } from '@/shared/server-functions/middlewares';
import { success, failure, apiErrorHandler } from '@/shared/server-functions/helpers';
import {
    updateInstrumentsSchema,
    updateGenresSchema,
    updateAvailabilitySchema,
    updateExperienceSchema,
    updateLogisticsSchema,
    updateLookingForSchema,
    updateBioSchema,
    completeSetupSchema,
    profileResponseSchema,
    fullProfileSchema
} from '@sound-connect/common/types/profile';

export const getProfile = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ context: { env, auth }, data }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/profile`, {
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
            return success(fullProfileSchema.parse(json));
        } catch (error) {
            console.error('getProfile error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateInstruments = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(updateInstrumentsSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/users/profile/instruments`, {
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

            const json = await response.json();
            return success(profileResponseSchema.parse(json));
        } catch (error) {
            console.error('updateInstruments error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateGenres = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(updateGenresSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/users/profile/genres`, {
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

            const json = await response.json();
            return success(profileResponseSchema.parse(json));
        } catch (error) {
            console.error('updateGenres error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateAvailability = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(updateAvailabilitySchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/users/profile/availability`, {
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

            const json = await response.json();
            return success(profileResponseSchema.parse(json));
        } catch (error) {
            console.error('updateAvailability error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateExperience = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(updateExperienceSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/users/profile/experience`, {
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

            const json = await response.json();
            return success(profileResponseSchema.parse(json));
        } catch (error) {
            console.error('updateExperience error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateLogistics = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(updateLogisticsSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/users/profile/logistics`, {
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

            const json = await response.json();
            return success(profileResponseSchema.parse(json));
        } catch (error) {
            console.error('updateLogistics error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateLookingFor = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(updateLookingForSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/users/profile/looking-for`, {
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

            const json = await response.json();
            return success(profileResponseSchema.parse(json));
        } catch (error) {
            console.error('updateLookingFor error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateBio = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(updateBioSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/users/profile/bio`, {
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

            const json = await response.json();
            return success(profileResponseSchema.parse(json));
        } catch (error) {
            console.error('updateBio error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const completeSetup = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(completeSetupSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/users/profile/complete-setup`, {
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
            return success(profileResponseSchema.parse(json));
        } catch (error) {
            console.error('completeSetup error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
