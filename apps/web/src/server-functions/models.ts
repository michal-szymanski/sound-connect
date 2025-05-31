import { getBindings } from '@/web/lib/cloudflare-bindings';
import { getSession } from '@/web/server-functions/auth';
import { errorHandler, getSessionCookie } from '@/web/server-functions/helpers';
import {
    chatMessageSchema,
    FollowRequestNotificationItem,
    userDTOSchema,
    followerSchema,
    followingSchema,
    postReactionSchema,
    postSchema,
    feedItemSchema
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

        const response = await API.fetch(`${API_URL}/users/followers/${data.userId}`, {
            headers
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(followerSchema);

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

        const response = await API.fetch(`${API_URL}/users/followings/${data.userId}`, {
            headers
        });

        if (!response.ok) {
            return await errorHandler(response);
        }

        try {
            const json = await response.json();
            const schema = z.array(followingSchema);

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

        const response = await API.fetch(`${API_URL}/users/send-follow-request`, {
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

export const acceptFollowRequest = createServerFn({ method: 'POST' })
    .validator((data: { notification: FollowRequestNotificationItem }) => data)
    .handler(async ({ data }) => {
        const { API, API_URL } = await getBindings();
        const cookie = getSessionCookie();

        const response = await API.fetch(`${API_URL}/users/accept-follow-request`, {
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

        const response = await API.fetch(`${API_URL}/users/delete-notification`, {
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

        const response = await API.fetch(`${API_URL}/users/update-notifications`, {
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

        const response = await API.fetch(`${API_URL}/users/unfollow`, {
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

export const getMutualFollowers = createServerFn()
    .validator((data: { userId: string }) => data)
    .handler(async ({ data }) => {
        const { headers } = getWebRequest()!;
        const { API, API_URL } = await getBindings();

        const response = await API.fetch(`${API_URL}/users/mutual-followers/${data.userId}`, {
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
        const response = await API.fetch(`${API_URL}/ws/chat/${roomId}/history`, {
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
