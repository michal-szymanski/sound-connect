import { env } from 'cloudflare:workers';
import { getSession } from '@/web/server-functions/auth';
import { errorHandler, getSessionCookie } from '@/web/server-functions/helpers';
import {
    userDTOSchema,
    postReactionSchema,
    postSchema,
    feedItemSchema,
    chatMessageSchema,
    postLikeDataSchema,
    followRequestAcceptedNotificationItemSchema,
    followRequestNotificationItemSchema,
    commentWithUserSchema,
    createCommentSchema
} from '@sound-connect/common/types/models';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getRoomId } from '@sound-connect/common/helpers';

export const getFeed = createServerFn().handler(async () => {
    const { API, API_URL } = env;
    const cookie = getSessionCookie();

    const response = await API.fetch(`${API_URL}/feed`, {
        headers: { Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ limit: z.number().optional(), offset: z.number().optional() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const searchParams = new URLSearchParams();
        if (data.limit) searchParams.set('limit', data.limit.toString());
        if (data.offset) searchParams.set('offset', data.offset.toString());

        const response = await API.fetch(`${API_URL}/feed?${searchParams.toString()}`, {
            headers: { Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/posts/${data.userId}`, {
            headers: { Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/posts/${data.postId}/reactions`, {
            headers: { Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/users/${data.userId}/followers`, {
            headers: { Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/users/${data.userId}/followings`, {
            headers: { Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/users/${data.userId}`, {
            headers: { Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/users/${data.userId}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const deleteNotification = createServerFn()
    .inputValidator(z.object({ notificationId: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/notifications/${data.notificationId}`, {
            method: 'DELETE',
            headers: { Cookie: cookie ?? '' },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const followUser = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/users/${data.userId}/follow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const unfollowUser = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/users/${data.userId}/unfollow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const getMutualFollowers = createServerFn()
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/users/${data.userId}/contacts`, {
            headers: { Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ peerId: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const result = await getSession();

        if (!result.success) {
            return { success: false, body: null } as const;
        }

        const user = result.body;
        const roomId = getRoomId(user.id, data.peerId);
        const response = await API.fetch(`${API_URL}/chat/${roomId}/history`, {
            headers: { Cookie: cookie ?? '' },
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
    .inputValidator(z.instanceof(FormData))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { Cookie: cookie ?? '' },
            body: data,
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const search = createServerFn()
    .inputValidator(z.object({ query: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/search?query=${data.query}`, {
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/users/${data.userId}/follow-request-status`, {
            method: 'GET',
            headers: { Cookie: cookie ?? '' },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        const result = (await response.json()) as { status: 'following' | 'pending' | 'none' };
        return { success: true, body: result } as const;
    });

export const updateNotification = createServerFn()
    .inputValidator(
        z.object({ notificationId: z.string(), notification: z.union([followRequestNotificationItemSchema, followRequestAcceptedNotificationItemSchema]) })
    )
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/notifications/${data.notificationId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
            body: JSON.stringify(data.notification),
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const likePost = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/posts/${data.postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/posts/${data.postId}/like`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/posts/${data.postId}/likes/users`, {
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/posts/${data.postId}/likes`, {
            headers: { Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/posts/${data.postId}`, {
            headers: { Cookie: cookie ?? '' },
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
    .inputValidator(z.object({ postId: z.number() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/posts/${data.postId}/comments`, {
            headers: { Cookie: cookie ?? '' },
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
    .inputValidator(createCommentSchema)
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const likeComment = createServerFn({ method: 'POST' })
    .inputValidator(z.object({ commentId: z.number() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/comments/${data.commentId}/like`, {
            method: 'POST',
            headers: { Cookie: cookie ?? '' },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const unlikeComment = createServerFn()
    .inputValidator(z.object({ commentId: z.number() }))
    .handler(async ({ data }) => {
        const { API, API_URL } = env;
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/comments/${data.commentId}/like`, {
            method: 'DELETE',
            headers: { Cookie: cookie ?? '' },
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });
