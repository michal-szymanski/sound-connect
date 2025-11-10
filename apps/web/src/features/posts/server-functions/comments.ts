import { commentWithUserSchema, createCommentSchema } from '@/common/types/models';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const getComments = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/posts/${data.postId}/comments`, {
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

            return success(z.array(commentWithUserSchema).parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const createComment = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(createCommentSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return success(null);
    });

export const likeComment = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ commentId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/comments/${data.commentId}/like`, {
            method: 'POST',
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return success(null);
    });

export const unlikeComment = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ commentId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/comments/${data.commentId}/like`, {
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
    });
