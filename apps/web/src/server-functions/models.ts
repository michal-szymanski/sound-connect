import { getRoomId } from '@/common/helpers';
import { userDTOSchema, feedItemSchema, chatMessageSchema, postLikeDataSchema, commentWithUserSchema, createCommentSchema } from '@/common/types/models';
import { postReactionSchema, postSchema, notificationSchema } from '@/common/types/drizzle';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { errorHandler } from '@/web/server-functions/helpers';
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
            return await errorHandler(response);
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
            return await errorHandler(response);
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
            return await errorHandler(response);
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
            return await errorHandler(response);
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

export const getFollowers = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/followers`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
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

export const getFollowings = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/followings`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
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

export const getUser = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        try {
            const json = await response.json();

            return { success: true, body: userDTOSchema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

export const sendFollowRequest = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const followUser = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const unfollowUser = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/unfollow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const getMutualFollowers = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/contacts`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
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

export const getChatHistory = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ peerId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const roomId = getRoomId(auth.user.id, data.peerId);
        const response = await env.API.fetch(`${env.API_URL}/chat/${roomId}/history`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(chatMessageSchema);

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
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const search = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ query: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/search?query=${data.query}`, {
            headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
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

export const getFollowRequestStatus = createServerFn({ method: 'GET' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/users/${data.userId}/follow-request-status`, {
            method: 'GET',
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        const result = (await response.json()) as { status: 'following' | 'pending' | 'none' };
        return { success: true, body: result } as const;
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
            return await errorHandler(response);
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
            return await errorHandler(response);
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
            return await errorHandler(response);
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
            return await errorHandler(response);
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
            return await errorHandler(response);
        }

        try {
            const json = await response.json();

            return { success: true, body: feedItemSchema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

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

export const testSentry = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/debug/test-sentry`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const getNotifications = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/notifications`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(notificationSchema);

            return { success: true, body: schema.parse(json) } as const;
        } catch (error) {
            console.error(error);
            return { success: false, body: null } as const;
        }
    });

export const markNotificationAsSeen = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ notificationId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/notifications/${data.notificationId}/seen`, {
            method: 'PATCH',
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const markAllNotificationsAsSeen = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/notifications/seen`, {
            method: 'PATCH',
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const deleteNotification = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ notificationId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        if (!auth) {
            return { success: false, body: null } as const;
        }

        const response = await env.API.fetch(`${env.API_URL}/notifications/${data.notificationId}`, {
            method: 'DELETE',
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });
