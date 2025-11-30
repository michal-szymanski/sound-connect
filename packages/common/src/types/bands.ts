import { z } from 'zod';
import { GenreEnum } from './profile-enums';

export const createBandInputSchema = z.object({
    name: z.string().min(1, 'Band name is required').max(100, 'Band name must be 100 characters or less'),
    description: z.string().min(1, 'Bio is required').max(500, 'Bio must be 500 characters or less'),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(1, 'State is required').max(100),
    country: z.string().max(100).default('USA'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    primaryGenre: z.enum(GenreEnum, { message: 'Please select a genre' }),
    lookingFor: z.string().max(500, 'Looking for must be 500 characters or less').optional()
});

export type CreateBandInput = z.infer<typeof createBandInputSchema>;

export const updateBandInputSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().min(1).max(500).optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    country: z.string().max(100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    primaryGenre: z.enum(GenreEnum).optional(),
    lookingFor: z.string().max(500).optional()
});

export type UpdateBandInput = z.infer<typeof updateBandInputSchema>;

export const bandSchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    primaryGenre: z.enum(GenreEnum).nullable(),
    lookingFor: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    backgroundImageUrl: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export type Band = z.infer<typeof bandSchema>;

export const bandMemberSchema = z.object({
    userId: z.string(),
    name: z.string(),
    profileImageUrl: z.string().nullable(),
    isAdmin: z.boolean(),
    joinedAt: z.string()
});

export type BandMember = z.infer<typeof bandMemberSchema>;

export const bandWithMembersSchema = bandSchema.extend({
    members: z.array(bandMemberSchema),
    isUserAdmin: z.boolean().optional()
});

export type BandWithMembers = z.infer<typeof bandWithMembersSchema>;

export const addBandMemberInputSchema = z.object({
    userId: z.string().min(1, 'User ID is required')
});

export type AddBandMemberInput = z.infer<typeof addBandMemberInputSchema>;

export const bandMembershipSchema = z.object({
    id: z.number(),
    name: z.string(),
    primaryGenre: z.enum(GenreEnum).nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    isAdmin: z.boolean(),
    joinedAt: z.string()
});

export type BandMembership = z.infer<typeof bandMembershipSchema>;

export const userBandsResponseSchema = z.object({
    bands: z.array(bandMembershipSchema)
});

export type UserBandsResponse = z.infer<typeof userBandsResponseSchema>;
