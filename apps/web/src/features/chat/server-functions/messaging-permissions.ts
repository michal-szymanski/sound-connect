import { createServerFn } from '@tanstack/react-start';
import { checkMessagingPermissionRequestSchema, checkMessagingPermissionResponseSchema } from '@sound-connect/common/types/messaging';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const checkMessagingPermission = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(checkMessagingPermissionRequestSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/chat/check-messaging-permission`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(checkMessagingPermissionResponseSchema.parse(json));
        } catch (error) {
            console.error('checkMessagingPermission error:', error);
            return failure('Failed to check messaging permission');
        }
    });
