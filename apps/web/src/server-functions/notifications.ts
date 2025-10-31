import { notificationSchema } from '@/common/types/drizzle';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { apiErrorHandler } from '@/web/server-functions/helpers';
import { authMiddleware } from '@/web/server-functions/middlewares';

export const getNotifications = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/notifications`, {
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
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
        const response = await env.API.fetch(`${env.API_URL}/notifications/${data.notificationId}/seen`, {
            method: 'PATCH',
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const markAllNotificationsAsSeen = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/notifications/seen`, {
            method: 'PATCH',
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return { success: true, body: null } as const;
    });

export const deleteNotification = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ notificationId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/notifications/${data.notificationId}`, {
            method: 'DELETE',
            headers: { Cookie: auth.cookie },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        return { success: true, body: null } as const;
    });
