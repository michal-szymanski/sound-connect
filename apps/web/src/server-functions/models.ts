import { getBindings } from '@/web/lib/cloudflare-bindings';
import { getSession } from '@/web/server-functions/auth';
import { errorHandler, getSessionCookie } from '@/web/server-functions/helpers';
import {
    FollowRequestNotificationItem,
    FollowRequestAcceptedNotificationItem,
    userDTOSchema,
    postReactionSchema,
    postSchema,
    feedItemSchema,
    chatMessageSchema,
    postLikeDataSchema
} from '@sound-connect/common/types/models';
import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { getRoomId } from '@sound-connect/common/helpers';

type NotificationItem = FollowRequestNotificationItem | FollowRequestAcceptedNotificationItem;

export const getFeed = createServerFn().handler(async () => {
    const { headers } = getWebRequest()!;
    const { API, API_URL } = await getBindings();

    const response = await API.fetch(`${API_URL}/feed`, {
        headers
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
    .validator((data: { limit?: number; offset?: number }) => data)
    .handler(async ({ data }) => {
        const { headers } = getWebRequest()!;
        const { API, API_URL } = await getBindings();

        const searchParams = new URLSearchParams();
        if (data.limit) searchParams.set('limit', data.limit.toString());
        if (data.offset) searchParams.set('offset', data.offset.toString());

        const response = await API.fetch(`${API_URL}/feed?${searchParams.toString()}`, {
            headers
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
    .validator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
        const { headers } = getWebRequest()!;
        const { API, API_URL } = await getBindings();

        const response = await API.fetch(`${API_URL}/posts/${data.userId}`, {
            headers
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
    .validator((data: { postId: number }) => data)
    .handler(async ({ data }) => {
        const { headers } = getWebRequest()!;
        const { API, API_URL } = await getBindings();

        const response = await API.fetch(`${API_URL}/posts/${data.postId}/reactions`, {
            headers
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
    .validator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
        const { headers } = getWebRequest()!;
        const { API, API_URL } = await getBindings();

        const response = await API.fetch(`${API_URL}/users/${data.userId}/followers`, {
            headers
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
    .validator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
        const { headers } = getWebRequest()!;
        const { API, API_URL } = await getBindings();

        const response = await API.fetch(`${API_URL}/users/${data.userId}/followings`, {
            headers
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
    .validator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
        const { headers } = getWebRequest()!;

        const response = await API.fetch(`${API_URL}/users/${data.userId}`, {
            headers
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
    .validator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
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
    .validator((data: { notificationId: string }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
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
    .validator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
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
    .validator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
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
    .validator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
        const { headers } = getWebRequest()!;
        const { API, API_URL } = await getBindings();

        const response = await API.fetch(`${API_URL}/users/${data.userId}/contacts`, {
            headers
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
    .validator((data: { peerId: string }) => data)
    .handler(async ({ data }) => {
        const { headers } = getWebRequest()!;
        const { API, API_URL } = await getBindings();

        const result = await getSession();

        if (!result.success) {
            return { success: false, body: null } as const;
        }

        const user = result.body;
        const roomId = getRoomId(user.id, data.peerId);
        const response = await API.fetch(`${API_URL}/chat/${roomId}/history`, {
            headers
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
    .validator((data: FormData) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { Cookie: cookie ?? '' },
            body: data,
            credentials: 'include'
        });

        console.log({ response });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const search = createServerFn()
    .validator((data: { query: string }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
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
    .validator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
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
    .validator((data: { notificationId: string; notification: NotificationItem }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
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
    .validator((data: { postId: number }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
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
    .validator((data: { postId: number }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
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
    .validator((data: { postId: number }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
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
    .validator((data: { postId: number }) => data)
    .handler(async ({ data }) => {
        const { headers } = getWebRequest()!;
        const { API, API_URL } = await getBindings();

        const response = await API.fetch(`${API_URL}/posts/${data.postId}/likes`, {
            headers
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
