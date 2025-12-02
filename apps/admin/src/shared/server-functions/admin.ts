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
