import { z } from 'zod';
import { GenreEnum } from './profile-enums';

export const searchRadiusEnum = [5, 10, 25, 50, 100] as const;

export const geocodingLookupResponseSchema = z.object({
    city: z.string(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    cached: z.boolean()
});

export type GeocodingLookupResponse = z.infer<typeof geocodingLookupResponseSchema>;

export const bandSearchParamsSchema = z
    .object({
        genre: z.enum(GenreEnum).optional(),
        city: z.string().min(2).max(100).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        radius: z
            .enum(searchRadiusEnum.map(String) as [string, ...string[]])
            .transform(Number)
            .optional(),
        lookingFor: z.string().min(1).max(200).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().min(1).max(50).default(12)
    })
    .refine(
        (data) => {
            if (data.radius && !(data.latitude !== undefined && data.longitude !== undefined)) {
                return false;
            }
            return true;
        },
        {
            message: 'Radius requires latitude and longitude to be provided',
            path: ['radius']
        }
    );

export type BandSearchParams = z.infer<typeof bandSearchParamsSchema>;

export const bandSearchResultSchema = z.object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    description: z.string().nullable(),
    primaryGenre: z.enum(GenreEnum).nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    lookingFor: z.string().nullable(),
    profileImageUrl: z.string().nullable(),
    memberCount: z.number(),
    distance: z.number().nullable().optional()
});

export type BandSearchResult = z.infer<typeof bandSearchResultSchema>;

export const bandSearchResponseSchema = z.object({
    results: z.array(bandSearchResultSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasMore: z.boolean()
    }),
    geocodingFallback: z.boolean().optional()
});

export type BandSearchResponse = z.infer<typeof bandSearchResponseSchema>;
