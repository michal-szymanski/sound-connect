import { z } from 'zod';
import { InstrumentEnum, GenreEnum, AvailabilityStatusEnum } from './profile-enums';

export const searchRadiusEnum = [5, 10, 25, 50, 100] as const;

export const profileSearchParamsSchema = z
    .object({
        instruments: z.array(z.enum(InstrumentEnum)).optional(),
        genres: z.array(z.enum(GenreEnum)).optional(),
        city: z.string().min(2).max(100).optional(),
        radius: z
            .enum(searchRadiusEnum.map(String) as [string, ...string[]])
            .transform(Number)
            .optional(),
        availabilityStatus: z.array(z.enum(AvailabilityStatusEnum)).optional(),
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().min(1).max(50).default(12)
    })
    .refine(
        (data) => {
            if (data.radius && !data.city) {
                return false;
            }
            return true;
        },
        {
            message: 'Radius requires city to be provided',
            path: ['radius']
        }
    );

export type ProfileSearchParams = z.infer<typeof profileSearchParamsSchema>;

export const profileSearchResultSchema = z.object({
    userId: z.string(),
    name: z.string(),
    image: z.string().nullable(),
    primaryInstrument: z.enum(InstrumentEnum).nullable(),
    yearsPlayingPrimary: z.number().nullable(),
    primaryGenre: z.enum(GenreEnum).nullable(),
    secondaryGenres: z.string().nullable(),
    status: z.enum(AvailabilityStatusEnum).nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    profileCompletion: z.number(),
    distance: z.number().nullable().optional(),
    matchedInstrumentType: z.enum(['primary', 'additional']).optional()
});

export type ProfileSearchResult = z.infer<typeof profileSearchResultSchema>;

export const profileSearchResponseSchema = z.object({
    results: z.array(profileSearchResultSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasMore: z.boolean()
    }),
    geocodingFallback: z.boolean().optional()
});

export type ProfileSearchResponse = z.infer<typeof profileSearchResponseSchema>;

export const geocodingLookupParamsSchema = z.object({
    city: z.string().min(2).max(100)
});

export type GeocodingLookupParams = z.infer<typeof geocodingLookupParamsSchema>;

export const geocodingLookupResponseSchema = z.object({
    city: z.string(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    cached: z.boolean()
});

export type GeocodingLookupResponse = z.infer<typeof geocodingLookupResponseSchema>;
