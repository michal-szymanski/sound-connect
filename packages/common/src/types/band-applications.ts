import { z } from 'zod';

export const applicationStatusEnum = z.enum(['pending', 'accepted', 'rejected']);

export type ApplicationStatus = z.infer<typeof applicationStatusEnum>;

export const createBandApplicationSchema = z.object({
    message: z
        .string()
        .min(1, 'Message is required')
        .max(500, 'Message must be 500 characters or less')
        .transform((str) => str.trim()),
    position: z
        .string()
        .max(100, 'Position must be 100 characters or less')
        .transform((str) => str.trim())
        .optional(),
    musicLink: z.string().url('Please enter a valid URL for your music link').max(500, 'Music link must be 500 characters or less').optional()
});

export type CreateBandApplicationInput = z.infer<typeof createBandApplicationSchema>;

export const rejectBandApplicationSchema = z.object({
    feedbackMessage: z
        .string()
        .max(300, 'Feedback message must be 300 characters or less')
        .transform((str) => str.trim())
        .optional()
});

export type RejectBandApplicationInput = z.infer<typeof rejectBandApplicationSchema>;

export const bandApplicationSchema = z.object({
    id: z.number(),
    bandId: z.number(),
    userId: z.string(),
    message: z.string(),
    position: z.string().nullable(),
    musicLink: z.string().nullable(),
    status: applicationStatusEnum,
    feedbackMessage: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string()
});

export type BandApplication = z.infer<typeof bandApplicationSchema>;

export const bandApplicationWithUserSchema = bandApplicationSchema.extend({
    username: z.string(),
    userName: z.string(),
    userImage: z.string().nullable()
});

export type BandApplicationWithUser = z.infer<typeof bandApplicationWithUserSchema>;

export const submitBandApplicationResponseSchema = z.object({
    success: z.boolean(),
    application: bandApplicationSchema.optional(),
    error: z.string().optional()
});

export type SubmitBandApplicationResponse = z.infer<typeof submitBandApplicationResponseSchema>;

export const getBandApplicationsResponseSchema = z.object({
    applications: z.array(bandApplicationWithUserSchema),
    total: z.number(),
    hasMore: z.boolean()
});

export type GetBandApplicationsResponse = z.infer<typeof getBandApplicationsResponseSchema>;

export const acceptBandApplicationResponseSchema = z.object({
    success: z.boolean(),
    application: bandApplicationSchema.optional(),
    member: z
        .object({
            id: z.number(),
            userId: z.string(),
            bandId: z.number(),
            isAdmin: z.boolean(),
            joinedAt: z.string()
        })
        .optional(),
    error: z.string().optional()
});

export type AcceptBandApplicationResponse = z.infer<typeof acceptBandApplicationResponseSchema>;

export const rejectBandApplicationResponseSchema = z.object({
    success: z.boolean(),
    application: bandApplicationSchema.optional(),
    error: z.string().optional()
});

export type RejectBandApplicationResponse = z.infer<typeof rejectBandApplicationResponseSchema>;
