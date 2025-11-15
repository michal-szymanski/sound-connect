import { chatMessageSchema } from '@/common/types/models';
import { conversationsResponseSchema } from '@/common/types/conversations';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const getChatHistory = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ roomId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const roomId = data.roomId;
        const response = await env.API.fetch(`${env.API_URL}/api/chat/${roomId}/history`, {
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
            const schema = z.array(chatMessageSchema);

            return success(schema.parse(json));
        } catch (error) {
            console.error(error);
            return failure(null);
        }
    });

export const getConversations = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(
        z.object({
            limit: z.number().optional(),
            offset: z.number().optional()
        })
    )
    .handler(async ({ data, context: { env, auth } }) => {
        const params = new URLSearchParams();
        if (data.limit) params.append('limit', data.limit.toString());
        if (data.offset) params.append('offset', data.offset.toString());

        const url = `${env.API_URL}/api/chat/conversations${params.toString() ? `?${params.toString()}` : ''}`;

        const response = await env.API.fetch(url, {
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
            return success(conversationsResponseSchema.parse(json));
        } catch (error) {
            console.error(error);
            return failure('Failed to parse conversations response');
        }
    });

export const markMessagesAsRead = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ roomId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/chat/${data.roomId}/mark-read`, {
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
