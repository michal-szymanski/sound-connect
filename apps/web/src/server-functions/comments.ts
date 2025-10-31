import { commentWithUserSchema, createCommentSchema } from '@/common/types/models';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { errorHandler } from '@/web/server-functions/helpers';
import { authMiddleware } from '@/web/server-functions/middlewares';

export const getComments = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/posts/${data.postId}/comments`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        try {
            const json = await response.json();

            return { success: true, body: z.array(commentWithUserSchema).parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: [] } as const;
        }
    });

export const createComment = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(createCommentSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const likeComment = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ commentId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/comments/${data.commentId}/like`, {
            method: 'POST',
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const unlikeComment = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ commentId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/comments/${data.commentId}/like`, {
            method: 'DELETE',
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });
