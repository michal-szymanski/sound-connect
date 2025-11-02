import { notificationSchema } from '@/common/types/drizzle';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { apiErrorHandler, failure, success } from '@/web/server-functions/helpers';
import { authMiddleware } from '@/web/server-functions/middlewares';
import { markNotificationsAsReadSchema } from '@/common/types/notifications';

export const getNotifications = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/notifications`, {
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
            const schema = z.array(notificationSchema);

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const markNotificationAsSeen = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ notificationId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/notifications/${data.notificationId}/seen`, {
            method: 'PATCH',
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

export const markAllNotificationsAsSeen = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/notifications/seen`, {
            method: 'PATCH',
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

export const markNotificationsAsRead = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(markNotificationsAsReadSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/notifications/mark-read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            body: JSON.stringify({ notificationIds: data.notificationIds }),
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return success(null);
    });

export const deleteNotification = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ notificationId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/notifications/${data.notificationId}`, {
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
