import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { authMiddleware } from '@/shared/server-functions/middlewares';
import { success, failure, apiErrorHandler } from '@/shared/server-functions/helpers';

const onboardingStatusSchema = z.discriminatedUnion('exists', [
    z.object({
        exists: z.literal(false)
    }),
    z.object({
        exists: z.literal(true),
        currentStep: z.number(),
        completedAt: z.number().nullable(),
        skippedAt: z.number().nullable()
    })
]);

const updateProgressSchema = z.object({
    step: z.number().min(1).max(6)
});

export const getOnboardingStatus = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/onboarding/status`, {
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
            return success(onboardingStatusSchema.parse(json));
        } catch (error) {
            console.error('getOnboardingStatus error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateOnboardingProgress = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(updateProgressSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/onboarding/progress`, {
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
            return success(onboardingStatusSchema.parse(json));
        } catch (error) {
            console.error('updateOnboardingProgress error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const completeOnboarding = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/onboarding/complete`, {
                method: 'POST',
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
            return success(onboardingStatusSchema.parse(json));
        } catch (error) {
            console.error('completeOnboarding error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const skipOnboarding = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/onboarding/skip`, {
                method: 'POST',
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
            return success(onboardingStatusSchema.parse(json));
        } catch (error) {
            console.error('skipOnboarding error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
