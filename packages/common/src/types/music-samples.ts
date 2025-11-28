import { z } from 'zod';
import { InstrumentEnum } from './profile-enums';

export const musicSampleMediaTypeEnum = z.enum(['audio', 'video']);

export type MusicSampleMediaType = z.infer<typeof musicSampleMediaTypeEnum>;

export const createMusicSampleSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
    description: z.string().max(500, 'Description must be 500 characters or less').optional(),
    instrument: z.enum(InstrumentEnum).optional(),
    mediaType: musicSampleMediaTypeEnum,
    r2Key: z.string().min(1, 'R2 key is required'),
    durationSeconds: z.number().int().min(0).optional(),
    fileSize: z.number().int().positive('File size must be positive')
});

export type CreateMusicSample = z.infer<typeof createMusicSampleSchema>;

export const updateMusicSampleSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less').optional(),
    description: z.string().max(500, 'Description must be 500 characters or less').nullable().optional(),
    instrument: z.enum(InstrumentEnum).nullable().optional()
});

export type UpdateMusicSample = z.infer<typeof updateMusicSampleSchema>;

export const musicSampleSchema = z.object({
    id: z.number(),
    userId: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    instrument: z.enum(InstrumentEnum).nullable(),
    mediaType: musicSampleMediaTypeEnum,
    r2Key: z.string(),
    durationSeconds: z.number().nullable(),
    fileSize: z.number(),
    sortOrder: z.number(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export type MusicSample = z.infer<typeof musicSampleSchema>;

export const reorderMusicSamplesSchema = z.object({
    orderedIds: z.array(z.number().int().positive()).min(1).max(10)
});

export type ReorderMusicSamples = z.infer<typeof reorderMusicSamplesSchema>;

export const musicSamplesListSchema = z.array(musicSampleSchema);

export type MusicSamplesList = z.infer<typeof musicSamplesListSchema>;
