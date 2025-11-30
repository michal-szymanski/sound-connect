import { z } from 'zod';
import { GenreEnum } from './profile-enums';

export const matchReasonSchema = z.object({
    type: z.enum(['instrument', 'genre', 'location']),
    label: z.string(),
    points: z.number()
});

export type MatchReason = z.infer<typeof matchReasonSchema>;

export const bandMemberPreviewSchema = z.object({
    id: z.string(),
    name: z.string(),
    profileImageUrl: z.string().nullable()
});

export type BandMemberPreview = z.infer<typeof bandMemberPreviewSchema>;

export const bandDiscoveryResultSchema = z.object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    profileImageUrl: z.string().nullable(),
    primaryGenre: z.enum(GenreEnum).nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    lookingFor: z.string().nullable(),
    distanceMiles: z.number(),
    matchScore: z.number(),
    matchReasons: z.array(matchReasonSchema),
    followerCount: z.number(),
    memberCount: z.number(),
    members: z.array(bandMemberPreviewSchema).optional()
});

export type BandDiscoveryResult = z.infer<typeof bandDiscoveryResultSchema>;

export const bandDiscoveryPaginationSchema = z.object({
    currentPage: z.number(),
    totalPages: z.number(),
    totalResults: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean()
});

export type BandDiscoveryPagination = z.infer<typeof bandDiscoveryPaginationSchema>;

export const bandDiscoveryResponseSchema = z.object({
    bands: z.array(bandDiscoveryResultSchema),
    pagination: bandDiscoveryPaginationSchema,
    profileStatus: z.enum(['incomplete', 'not_found']).optional(),
    missingFields: z.array(z.string()).optional()
});

export type BandDiscoveryResponse = z.infer<typeof bandDiscoveryResponseSchema>;

export const bandDiscoveryParamsSchema = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(50).default(12)
});

export type BandDiscoveryParams = z.infer<typeof bandDiscoveryParamsSchema>;

export const discoveryAnalyticsEventSchema = z.object({
    sessionId: z.string().uuid(),
    eventType: z.enum(['page_view', 'card_click', 'application', 'pagination']),
    bandId: z.number().optional(),
    matchScore: z.number().optional(),
    matchReasons: z.array(matchReasonSchema).optional(),
    positionInFeed: z.number().optional(),
    pageNumber: z.number().optional()
});

export type DiscoveryAnalyticsEvent = z.infer<typeof discoveryAnalyticsEventSchema>;
