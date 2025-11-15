import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { chatHistoryResponseSchema } from '@sound-connect/common/types/messaging';
import { messageSchema } from '@sound-connect/common/types/drizzle';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const getBandChatHistory = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(
        z.object({
            bandId: z.number(),
            limit: z.number().optional(),
            offset: z.number().optional()
        })
    )
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const params = new URLSearchParams();
            if (data.limit) params.append('limit', data.limit.toString());
            if (data.offset) params.append('offset', data.offset.toString());

            const url = `${env.API_URL}/api/bands/${data.bandId}/chat/history${params.toString() ? `?${params.toString()}` : ''}`;

            const response = await env.API.fetch(url, {
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(chatHistoryResponseSchema.parse(json));
        } catch (error) {
            console.error('getBandChatHistory error:', error);
            return failure('Failed to load band chat history');
        }
    });

export const sendBandMessage = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(
        z.object({
            bandId: z.number(),
            content: z.string()
        })
    )
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/bands/${data.bandId}/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify({ content: data.content }),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(messageSchema.parse(json));
        } catch (error) {
            console.error('sendBandMessage error:', error);
            return failure('Failed to send message');
        }
    });
