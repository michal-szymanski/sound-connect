import { feedItemSchema, postLikeDataSchema, userDTOSchema } from '@/common/types/models';
import { postReactionSchema, postSchema } from '@/common/types/drizzle';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { apiErrorHandler } from '@/web/server-functions/helpers';
import { authMiddleware } from '@/web/server-functions/middlewares';

export const getFeed = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/feed`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(feedItemSchema);

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

export const getFeedPaginated = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const searchParams = new URLSearchParams();
        if (data.limit) searchParams.set('limit', data.limit.toString());
        if (data.offset) searchParams.set('offset', data.offset.toString());

        const response = await env.API.fetch(`${env.API_URL}/feed?${searchParams.toString()}`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(feedItemSchema);

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

export const getPosts = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/posts`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(postSchema);

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

export const getReactions = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/posts/${data.postId}/reactions`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(postReactionSchema);

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

export const addPost = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.instanceof(FormData))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/posts`, {
            method: 'POST',
            headers: { Cookie: auth.cookie },
            body: data,
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const likePost = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/posts/${data.postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = postLikeDataSchema;

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

export const unlikePost = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/posts/${data.postId}/like`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = postLikeDataSchema;

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

export const getPostLikesUsers = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/posts/${data.postId}/likes/users`, {
            headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(userDTOSchema);

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

export const getPostLikes = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/posts/${data.postId}/likes`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = postLikeDataSchema;

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

export const getPost = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/posts/${data.postId}`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        try {
            const json = await response.json();

            return { success: true, body: feedItemSchema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });
