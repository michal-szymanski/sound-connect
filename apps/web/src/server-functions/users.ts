import { userDTOSchema } from '@/common/types/models';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { apiErrorHandler, failure, success } from '@/web/server-functions/helpers';
import { authMiddleware } from '@/web/server-functions/middlewares';

export const getFollowers = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/followers`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(userDTOSchema);

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const getFollowings = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/followings`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(userDTOSchema);

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const getUser = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();

            return success(userDTOSchema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const followUser = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return success(null);
    });

export const unfollowUser = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/unfollow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return success(null);
    });

export const getMutualFollowers = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/contacts`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(userDTOSchema);

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const search = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ query: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/search?query=${data.query}`, {
            headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(userDTOSchema);

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const getFollowRequestStatus = createServerFn({ method: 'GET' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/follow-request-status`, {
            method: 'GET',
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.object({
                status: z.enum(['following', 'pending', 'none'])
            });

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });
