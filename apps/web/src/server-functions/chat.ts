import { getRoomId } from '@/common/helpers';
import { chatMessageSchema } from '@/common/types/models';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { apiErrorHandler } from '@/web/server-functions/helpers';
import { authMiddleware } from '@/web/server-functions/middlewares';

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
            return await apiErrorHandler(response);
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
