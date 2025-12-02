import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { adminAuthMiddleware } from '@/shared/server-functions/middlewares';
import { success, apiErrorHandler } from '@/shared/server-functions/helpers';
import { userSchema } from '@/common/types/drizzle';

const getUsersInputSchema = z.object({
    search: z.string().optional(),
    limit: z.number().default(10),
    offset: z.number().default(0)
});

const getUserByIdInputSchema = z.object({
    id: z.string()
});

const updateUserInputSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    role: z.enum(['user', 'admin']).optional()
});

const deleteUserInputSchema = z.object({
    id: z.string()
});

const usersResponseSchema = z.object({
    users: z.array(userSchema),
    total: z.number()
});

const statsSchema = z.object({
    totalUsers: z.number(),
    recentSignups: z.number()
});

const signupsStatsInputSchema = z.object({
    days: z.number().default(7)
});

const signupsStatsSchema = z.object({
    data: z.array(
        z.object({
            date: z.string(),
            count: z.number()
        })
    ),
    total: z.number()
});

const instrumentsStatsSchema = z.object({
    data: z.array(
        z.object({
            instrument: z.string(),
            count: z.number(),
            percentage: z.number()
        })
    ),
    total: z.number()
});

const moderationStatsSchema = z.object({
    pending: z.number(),
    approved: z.number(),
    rejected: z.number(),
    total: z.number(),
    lastModerated: z.string().nullable()
});

const locationsStatsInputSchema = z.object({
    limit: z.number().default(10)
});

const locationsStatsSchema = z.object({
    data: z.array(
        z.object({
            city: z.string(),
            country: z.string().nullable(),
            count: z.number()
        })
    ),
    othersCount: z.number(),
    total: z.number()
});

const onboardingStatsSchema = z.object({
    steps: z.array(
        z.object({
            step: z.number(),
            usersAtStep: z.number()
        })
    ),
    completed: z.number(),
    skipped: z.number(),
    inProgress: z.number(),
    notStarted: z.number()
});

const bandsStatsInputSchema = z.object({
    weeks: z.number().default(8)
});

const bandsStatsSchema = z.object({
    data: z.array(
        z.object({
            week: z.string(),
            bandsCreated: z.number(),
            applications: z.number()
        })
    ),
    totalBands: z.number(),
    totalApplications: z.number()
});

export const getUsers = createServerFn({ method: 'GET' })
    .middleware([adminAuthMiddleware])
    .inputValidator(getUsersInputSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const params = new URLSearchParams({
            limit: data.limit.toString(),
            offset: data.offset.toString(),
            ...(data.search && { search: data.search })
        });

        const response = await env.API.fetch(`${env.API_URL}/api/admin/users?${params}`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(usersResponseSchema.parse(json));
    });

export const getUserById = createServerFn({ method: 'GET' })
    .middleware([adminAuthMiddleware])
    .inputValidator(getUserByIdInputSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/admin/users/${data.id}`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(userSchema.parse(json));
    });

export const updateUser = createServerFn({ method: 'POST' })
    .middleware([adminAuthMiddleware])
    .inputValidator(updateUserInputSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const { id, ...updateData } = data;

        const response = await env.API.fetch(`${env.API_URL}/api/admin/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(userSchema.parse(json));
    });

export const deleteUser = createServerFn({ method: 'POST' })
    .middleware([adminAuthMiddleware])
    .inputValidator(deleteUserInputSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/admin/users/${data.id}`, {
            method: 'DELETE',
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return success(null);
    });

export const getStats = createServerFn({ method: 'GET' })
    .middleware([adminAuthMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/admin/stats`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(statsSchema.parse(json));
    });

export const getSignupsStats = createServerFn({ method: 'GET' })
    .middleware([adminAuthMiddleware])
    .inputValidator(signupsStatsInputSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const params = new URLSearchParams({
            days: data.days.toString()
        });

        const response = await env.API.fetch(`${env.API_URL}/api/admin/stats/signups?${params}`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(signupsStatsSchema.parse(json));
    });

export const getInstrumentsStats = createServerFn({ method: 'GET' })
    .middleware([adminAuthMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/admin/stats/instruments`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(instrumentsStatsSchema.parse(json));
    });

export const getModerationStats = createServerFn({ method: 'GET' })
    .middleware([adminAuthMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/admin/stats/moderation`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(moderationStatsSchema.parse(json));
    });

export const getLocationsStats = createServerFn({ method: 'GET' })
    .middleware([adminAuthMiddleware])
    .inputValidator(locationsStatsInputSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const params = new URLSearchParams({
            limit: data.limit.toString()
        });

        const response = await env.API.fetch(`${env.API_URL}/api/admin/stats/locations?${params}`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(locationsStatsSchema.parse(json));
    });

export const getOnboardingStats = createServerFn({ method: 'GET' })
    .middleware([adminAuthMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/admin/stats/onboarding`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(onboardingStatsSchema.parse(json));
    });

export const getBandsStats = createServerFn({ method: 'GET' })
    .middleware([adminAuthMiddleware])
    .inputValidator(bandsStatsInputSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const params = new URLSearchParams({
            weeks: data.weeks.toString()
        });

        const response = await env.API.fetch(`${env.API_URL}/api/admin/stats/bands?${params}`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            }
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(bandsStatsSchema.parse(json));
    });
