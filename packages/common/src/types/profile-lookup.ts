import { z } from 'zod';
import { fullProfileSchema } from './profile';
import { bandWithMembersSchema } from './bands';

export const ProfileTypeEnum = ['user', 'band'] as const;
export type ProfileType = (typeof ProfileTypeEnum)[number];

export const userProfileLookupResultSchema = z.object({
    type: z.literal('user'),
    data: fullProfileSchema
});

export const bandProfileLookupResultSchema = z.object({
    type: z.literal('band'),
    data: bandWithMembersSchema
});

export const profileLookupResultSchema = z.discriminatedUnion('type', [userProfileLookupResultSchema, bandProfileLookupResultSchema]);

export type UserProfileLookupResult = z.infer<typeof userProfileLookupResultSchema>;
export type BandProfileLookupResult = z.infer<typeof bandProfileLookupResultSchema>;
export type ProfileLookupResult = z.infer<typeof profileLookupResultSchema>;

export const profileLookupParamsSchema = z.object({
    username: z.string().min(1)
});

export type ProfileLookupParams = z.infer<typeof profileLookupParamsSchema>;

export const profileLookupResponseSchema = z.object({
    profile: profileLookupResultSchema
});

export type ProfileLookupResponse = z.infer<typeof profileLookupResponseSchema>;

export const profileNotFoundErrorSchema = z.object({
    error: z.literal('Profile not found'),
    username: z.string()
});

export type ProfileNotFoundError = z.infer<typeof profileNotFoundErrorSchema>;
