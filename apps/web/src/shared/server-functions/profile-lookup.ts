import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { profileLookupResultSchema } from '@sound-connect/common/types/profile-lookup';
import { apiErrorHandler, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const getProfileByUsername = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ username: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/profiles/${data.username}`, {
            headers: {
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            credentials: 'include'
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = (await response.json()) as { profile: unknown };
        return success(profileLookupResultSchema.parse(json.profile));
    });
