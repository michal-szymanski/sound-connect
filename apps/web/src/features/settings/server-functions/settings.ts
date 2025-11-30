import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { authMiddleware, envMiddleware } from '@/shared/server-functions/middlewares';
import { success, failure, apiErrorHandler } from '@/shared/server-functions/helpers';
import {
    updateEmailSchema,
    updatePasswordSchema,
    updateEmailResponseSchema,
    updatePasswordResponseSchema,
    privacySettingsSchema,
    updatePrivacySettingsSchema,
    updatePrivacySettingsResponseSchema,
    notificationSettingsSchema,
    updateNotificationSettingsSchema,
    updateNotificationSettingsResponseSchema,
    blockedUsersResponseSchema,
    blockUserResponseSchema,
    unblockUserResponseSchema,
    exportDataResponseSchema,
    deleteAccountSchema,
    deleteAccountResponseSchema,
    accountInfoSchema,
    checkUsernameAvailabilitySchema,
    checkUsernameAvailabilityResponseSchema,
    updateUsernameSchema,
    updateUsernameResponseSchema
} from '@sound-connect/common/types/settings';

export const getAccountInfo = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/me/account-info`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(accountInfoSchema.parse(json));
        } catch (error) {
            console.error('getAccountInfo error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateEmail = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(updateEmailSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/me/email`, {
                method: 'PATCH',
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
            return success(updateEmailResponseSchema.parse(json));
        } catch (error) {
            console.error('updateEmail error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updatePassword = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(updatePasswordSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/me/password`, {
                method: 'PATCH',
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
            return success(updatePasswordResponseSchema.parse(json));
        } catch (error) {
            console.error('updatePassword error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getPrivacySettings = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/me/settings/privacy`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(privacySettingsSchema.parse(json));
        } catch (error) {
            console.error('getPrivacySettings error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updatePrivacySettings = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(updatePrivacySettingsSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/me/settings/privacy`, {
                method: 'PATCH',
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
            return success(updatePrivacySettingsResponseSchema.parse(json));
        } catch (error) {
            console.error('updatePrivacySettings error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getNotificationSettings = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/me/settings/notifications`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(notificationSettingsSchema.parse(json));
        } catch (error) {
            console.error('getNotificationSettings error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateNotificationSettings = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(updateNotificationSettingsSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/me/settings/notifications`, {
                method: 'PATCH',
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
            return success(updateNotificationSettingsResponseSchema.parse(json));
        } catch (error) {
            console.error('updateNotificationSettings error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getBlockedUsers = createServerFn()
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/me/blocked`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(blockedUsersResponseSchema.parse(json));
        } catch (error) {
            console.error('getBlockedUsers error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const blockUser = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/${data.userId}/block`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(blockUserResponseSchema.parse(json));
        } catch (error) {
            console.error('blockUser error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const unblockUser = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/${data.userId}/block`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(unblockUserResponseSchema.parse(json));
        } catch (error) {
            console.error('unblockUser error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const exportData = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .handler(async ({ context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/me/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(exportDataResponseSchema.parse(json));
        } catch (error) {
            console.error('exportData error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const deleteAccount = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(deleteAccountSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/me`, {
                method: 'DELETE',
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
            return success(deleteAccountResponseSchema.parse(json));
        } catch (error) {
            console.error('deleteAccount error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const checkUsernameAvailability = createServerFn({ method: 'POST' })
    .middleware([envMiddleware])
    .inputValidator(checkUsernameAvailabilitySchema)
    .handler(async ({ data, context: { env } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/username/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(checkUsernameAvailabilityResponseSchema.parse(json));
        } catch (error) {
            console.error('checkUsernameAvailability error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateUsername = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(updateUsernameSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/me/username`, {
                method: 'PATCH',
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
            return success(updateUsernameResponseSchema.parse(json));
        } catch (error) {
            console.error('updateUsername error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
