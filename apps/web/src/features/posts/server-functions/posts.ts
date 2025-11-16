import { feedItemSchema, postLikeDataSchema, userDTOSchema } from '@/common/types/models';
import { postReactionSchema, postSchema } from '@/common/types/drizzle';
import { createServerFn } from '@tanstack/react-start';
import { redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const getFeed = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        const response = await env.API.fetch(`${env.API_URL}/api/feed`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(feedItemSchema);

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const getFeedPaginated = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        const searchParams = new URLSearchParams();
        if (data.limit) searchParams.set('limit', data.limit.toString());
        if (data.offset) searchParams.set('offset', data.offset.toString());

        const response = await env.API.fetch(`${env.API_URL}/api/feed?${searchParams.toString()}`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(feedItemSchema);

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const getPosts = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        const response = await env.API.fetch(`${env.API_URL}/api/users/${data.userId}/posts`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(postSchema);

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const getReactions = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        const response = await env.API.fetch(`${env.API_URL}/api/posts/${data.postId}/reactions`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(postReactionSchema);

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const addPost = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.instanceof(FormData))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        const response = await env.API.fetch(`${env.API_URL}/api/posts`, {
            method: 'POST',
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            body: data,
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return success(null);
    });

export const likePost = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        const response = await env.API.fetch(`${env.API_URL}/api/posts/${data.postId}/like`, {
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

        try {
            const json = await response.json();
            const schema = postLikeDataSchema;

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const unlikePost = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        const response = await env.API.fetch(`${env.API_URL}/api/posts/${data.postId}/like`, {
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

        try {
            const json = await response.json();
            const schema = postLikeDataSchema;

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const getPostLikesUsers = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        const response = await env.API.fetch(`${env.API_URL}/api/posts/${data.postId}/likes/users`, {
            headers: {
                'Content-Type': 'application/json',
                ...(auth.cookie && { Cookie: auth.cookie })
            },
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

export const getPostLikes = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        const response = await env.API.fetch(`${env.API_URL}/api/posts/${data.postId}/likes`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = postLikeDataSchema;

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const getPost = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) throw redirect({ to: '/sign-in' });

        const response = await env.API.fetch(`${env.API_URL}/api/posts/${data.postId}`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();

            return success(feedItemSchema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });
