import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import {
    createBandInputSchema,
    updateBandInputSchema,
    addBandMemberInputSchema,
    bandSchema,
    bandWithMembersSchema,
    bandMemberSchema,
    userBandsResponseSchema
} from '@sound-connect/common/types/bands';
import { createBandPostInputSchema, bandPostSchema, bandPostsResponseSchema } from '@sound-connect/common/types/band-posts';
import {
    bandFollowersResponseSchema,
    bandFollowerCountSchema,
    isFollowingBandSchema,
    followBandResponseSchema
} from '@sound-connect/common/types/band-follows';
import { apiErrorHandler, failure, success } from '@/shared/server-functions/helpers';
import { authMiddleware } from '@/shared/server-functions/middlewares';

export const createBand = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(createBandInputSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/bands`, {
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
            return success(bandSchema.parse(json));
        } catch (error) {
            console.error('createBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getBand = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/bands/${data.bandId}`, {
                method: 'GET',
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandWithMembersSchema.parse(json));
        } catch (error) {
            console.error('getBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateBand = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(updateBandInputSchema.extend({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const { bandId, ...updateData } = data;

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${bandId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(updateData),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandSchema.parse(json));
        } catch (error) {
            console.error('updateBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const deleteBand = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/bands/${data.bandId}`, {
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
        } catch (error) {
            console.error('deleteBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const addBandMember = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(addBandMemberInputSchema.extend({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const { bandId, userId } = data;

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${bandId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify({ userId }),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandMemberSchema.parse(json));
        } catch (error) {
            console.error('addBandMember error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const removeBandMember = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number(), userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const { bandId, userId } = data;

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${bandId}/members/${userId}`, {
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
        } catch (error) {
            console.error('removeBandMember error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getUserBands = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ userId: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/users/${data.userId}/bands`, {
                method: 'GET',
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(userBandsResponseSchema.parse(json));
        } catch (error) {
            console.error('getUserBands error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const createBandPost = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(createBandPostInputSchema.extend({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const { bandId, ...postData } = data;

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${bandId}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify(postData),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandPostSchema.parse(json));
        } catch (error) {
            console.error('createBandPost error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getBandPosts = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number(), page: z.number().optional(), limit: z.number().optional() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const searchParams = new URLSearchParams();
            if (data.page) searchParams.set('page', data.page.toString());
            if (data.limit) searchParams.set('limit', data.limit.toString());

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${data.bandId}/posts?${searchParams.toString()}`, {
                method: 'GET',
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandPostsResponseSchema.parse(json));
        } catch (error) {
            console.error('getBandPosts error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const followBand = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/bands/${data.bandId}/follow`, {
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
            return success(followBandResponseSchema.parse(json));
        } catch (error) {
            console.error('followBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const unfollowBand = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/bands/${data.bandId}/follow`, {
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
        } catch (error) {
            console.error('unfollowBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getBandFollowers = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number(), page: z.number().optional(), limit: z.number().optional() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const searchParams = new URLSearchParams();
            if (data.page) searchParams.set('page', data.page.toString());
            if (data.limit) searchParams.set('limit', data.limit.toString());

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${data.bandId}/followers?${searchParams.toString()}`, {
                method: 'GET',
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandFollowersResponseSchema.parse(json));
        } catch (error) {
            console.error('getBandFollowers error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getBandFollowerCount = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/bands/${data.bandId}/followers/count`, {
                method: 'GET',
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandFollowerCountSchema.parse(json));
        } catch (error) {
            console.error('getBandFollowerCount error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const getIsFollowingBand = createServerFn()
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const response = await env.API.fetch(`${env.API_URL}/api/bands/${data.bandId}/is-following`, {
                method: 'GET',
                headers: {
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(isFollowingBandSchema.parse(json));
        } catch (error) {
            console.error('getIsFollowingBand error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateBandProfileImage = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number(), profileImageUrl: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const { bandId, profileImageUrl } = data;

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${bandId}/profile-image`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify({ profileImageUrl }),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandSchema.parse(json));
        } catch (error) {
            console.error('updateBandProfileImage error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });

export const updateBandBackgroundImage = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(z.object({ bandId: z.number(), backgroundImageUrl: z.string() }))
    .handler(async ({ data, context: { env, auth } }) => {
        try {
            const { bandId, backgroundImageUrl } = data;

            const response = await env.API.fetch(`${env.API_URL}/api/bands/${bandId}/background-image`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(auth.cookie && { Cookie: auth.cookie })
                },
                body: JSON.stringify({ backgroundImageUrl }),
                credentials: 'include'
            });

            if (!response.ok) {
                return await apiErrorHandler(response);
            }

            const json = await response.json();
            return success(bandSchema.parse(json));
        } catch (error) {
            console.error('updateBandBackgroundImage error:', error);
            return failure({ status: 500, message: 'An unexpected error occurred' });
        }
    });
