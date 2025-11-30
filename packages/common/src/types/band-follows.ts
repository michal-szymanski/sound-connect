import { z } from 'zod';

export const bandFollowerSchema = z.object({
    userId: z.string(),
    username: z.string(),
    name: z.string(),
    profileImageUrl: z.string().nullable(),
    primaryInstrument: z.string().nullable(),
    createdAt: z.string()
});

export type BandFollower = z.infer<typeof bandFollowerSchema>;

export const bandFollowersResponseSchema = z.object({
    followers: z.array(bandFollowerSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasMore: z.boolean()
    })
});

export type BandFollowersResponse = z.infer<typeof bandFollowersResponseSchema>;

export const bandFollowerCountSchema = z.object({
    count: z.number()
});

export type BandFollowerCount = z.infer<typeof bandFollowerCountSchema>;

export const isFollowingBandSchema = z.object({
    isFollowing: z.boolean()
});

export type IsFollowingBand = z.infer<typeof isFollowingBandSchema>;

export const followBandResponseSchema = z.object({
    followerId: z.string(),
    bandId: z.number(),
    createdAt: z.string()
});

export type FollowBandResponse = z.infer<typeof followBandResponseSchema>;
