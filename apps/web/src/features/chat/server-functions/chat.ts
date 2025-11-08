import { getRoomId } from '@/common/helpers';
import { chatMessageSchema } from '@/common/types/models';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const getChatHistory = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ peerId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const roomId = getRoomId(auth.user.id, data.peerId);
        const response = await env.API.fetch(`${env.API_URL}/chat/${roomId}/history`, {
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
