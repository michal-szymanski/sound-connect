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
    chatMessageSchema
} from '@sound-connect/common/types/models';
import { createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { getRoomId } from '@sound-connect/common/helpers';

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

export const acceptFollowRequest = createServerFn({ method: 'POST' })
    .validator((data: { notification: FollowRequestNotificationItem }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/notifications/accept-follow-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const deleteNotification = createServerFn({ method: 'POST' })
    .validator((data: { notification: FollowRequestNotificationItem }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/notifications/delete-follow-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const updateNotifications = createServerFn({ method: 'POST' })
    .validator((data: { notifications: FollowRequestNotificationItem[] }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/notifications/update-follow-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
            body: JSON.stringify(data),
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
    .validator((data: { content: string }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
            body: JSON.stringify(data),
            credentials: 'include'
        });

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

export const deleteFollowRequestAcceptedNotification = createServerFn({ method: 'POST' })
    .validator((data: { notification: FollowRequestAcceptedNotificationItem }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/notifications/delete-follow-request-accepted`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const updateFollowRequestAcceptedNotifications = createServerFn({ method: 'POST' })
    .validator((data: { notifications: FollowRequestAcceptedNotificationItem[] }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/notifications/update-follow-request-accepted`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: cookie ?? '' },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        return { success: true, body: null } as const;
    });
