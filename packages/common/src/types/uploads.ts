import { z } from 'zod';

export const uploadPurposeEnum = z.enum(['profile-image', 'band-image', 'post-media', 'music-sample', 'background-image']);

export type UploadPurpose = z.infer<typeof uploadPurposeEnum>;

export const presignedUrlRequestSchema = z.object({
    purpose: uploadPurposeEnum,
    fileType: z.string().min(1, 'File type is required'),
    fileSize: z.number().int().positive('File size must be positive'),
    fileName: z
        .string()
        .min(1, 'File name is required')
        .max(255, 'File name must be 255 characters or less')
        .regex(/^[a-zA-Z0-9._-]+$/, 'File name contains invalid characters'),
    bandId: z.number().int().positive().optional()
});

export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;

export const presignedUrlResponseSchema = z.object({
    uploadUrl: z.string().url(),
    key: z.string().min(1),
    sessionId: z.string().uuid(),
    expiresAt: z.string().datetime(),
    maxFileSize: z.number().int().positive()
});

export type PresignedUrlResponse = z.infer<typeof presignedUrlResponseSchema>;

export const uploadConfirmRequestSchema = z.object({
    sessionId: z.string().uuid(),
    key: z.string().min(1)
});

export type UploadConfirmRequest = z.infer<typeof uploadConfirmRequestSchema>;

export const uploadConfirmResponseSchema = z.object({
    success: z.boolean(),
    publicUrl: z.string().url(),
    key: z.string().min(1)
});

export type UploadConfirmResponse = z.infer<typeof uploadConfirmResponseSchema>;

export const batchConfirmRequestSchema = z.object({
    sessionIds: z.array(z.string().uuid()).min(1).max(5),
    keys: z.array(z.string().min(1)).min(1).max(5)
});

export type BatchConfirmRequest = z.infer<typeof batchConfirmRequestSchema>;

export const batchConfirmResponseSchema = z.object({
    results: z.array(uploadConfirmResponseSchema)
});

export type BatchConfirmResponse = z.infer<typeof batchConfirmResponseSchema>;

export const uploadSessionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    uploadType: uploadPurposeEnum,
    bandId: z.number().nullable(),
    fileName: z.string(),
    fileSize: z.number(),
    contentType: z.string(),
    tempKey: z.string(),
    expiresAt: z.string(),
    createdAt: z.string(),
    confirmedAt: z.string().nullable()
});

export type UploadSession = z.infer<typeof uploadSessionSchema>;
