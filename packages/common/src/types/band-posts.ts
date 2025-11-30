import { z } from 'zod';
import { feedItemSchema } from './models';

export const createBandPostInputSchema = z.object({
    content: z.string().min(1, 'Post content is required').max(5000, 'Post content must be 5000 characters or less'),
    media: z
        .array(
            z.object({
                type: z.enum(['image', 'video', 'audio']),
                key: z.string(),
                title: z.string().max(100).optional()
            })
        )
        .max(4, 'Maximum 4 media items allowed')
        .optional()
});

export type CreateBandPostInput = z.infer<typeof createBandPostInputSchema>;

export const bandInfoSchema = z.object({
    id: z.number(),
    name: z.string(),
    username: z.string(),
    profileImageUrl: z.string().nullable()
});

export type BandInfo = z.infer<typeof bandInfoSchema>;

export const bandPostSchema = z.object({
    id: z.number(),
    authorType: z.literal('band'),
    bandId: z.number(),
    userId: z.string(),
    content: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']),
    createdAt: z.string(),
    band: bandInfoSchema,
    media: z
        .array(
            z.object({
                id: z.number(),
                type: z.enum(['image', 'video', 'audio']),
                key: z.string(),
                title: z.string().nullable()
            })
        )
        .optional()
});

export type BandPost = z.infer<typeof bandPostSchema>;

export const bandPostsResponseSchema = z.object({
    posts: z.array(feedItemSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasMore: z.boolean()
    })
});

export type BandPostsResponse = z.infer<typeof bandPostsResponseSchema>;
