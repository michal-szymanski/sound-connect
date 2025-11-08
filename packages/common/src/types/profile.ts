import { z } from 'zod';
import { InstrumentEnum, GenreEnum, AvailabilityStatusEnum, CommitmentLevelEnum, RehearsalFrequencyEnum, GiggingLevelEnum } from './profile-enums';

export const additionalInstrumentSchema = z.object({
    instrument: z.enum(InstrumentEnum),
    years: z.number().int().min(0).max(70)
});

export const updateInstrumentsSchema = z
    .object({
        primaryInstrument: z.enum(InstrumentEnum),
        yearsPlayingPrimary: z.number().int().min(0).max(70),
        additionalInstruments: z.array(additionalInstrumentSchema).max(4).optional().default([]),
        seekingToPlay: z.array(z.enum(InstrumentEnum)).optional().default([])
    })
    .refine(
        (data) => {
            const primaryInstrument = data.primaryInstrument;
            return !data.additionalInstruments.some((inst) => inst.instrument === primaryInstrument);
        },
        {
            message: 'Additional instruments cannot include your primary instrument'
        }
    );

export const updateGenresSchema = z
    .object({
        primaryGenre: z.enum(GenreEnum),
        secondaryGenres: z.array(z.enum(GenreEnum)).max(3).optional().default([]),
        influences: z.string().max(500).optional()
    })
    .refine(
        (data) => {
            const primaryGenre = data.primaryGenre;
            return !data.secondaryGenres.some((genre) => genre === primaryGenre);
        },
        {
            message: 'Secondary genres cannot include your primary genre'
        }
    );

export const updateAvailabilitySchema = z
    .object({
        status: z.enum(AvailabilityStatusEnum),
        statusExpiresAt: z.string().datetime().optional(),
        commitmentLevel: z.enum(CommitmentLevelEnum).optional(),
        weeklyAvailability: z.string().max(200).optional(),
        rehearsalFrequency: z.enum(RehearsalFrequencyEnum).optional()
    })
    .refine(
        (data) => {
            if (data.status === 'actively_looking') {
                return !!data.statusExpiresAt;
            }
            return true;
        },
        {
            message: 'statusExpiresAt is required when status is actively_looking',
            path: ['statusExpiresAt']
        }
    )
    .refine(
        (data) => {
            if (data.statusExpiresAt) {
                const expiresAt = new Date(data.statusExpiresAt);
                const now = new Date();
                return expiresAt > now;
            }
            return true;
        },
        {
            message: 'statusExpiresAt must be a future date',
            path: ['statusExpiresAt']
        }
    );

export const updateExperienceSchema = z.object({
    giggingLevel: z.enum(GiggingLevelEnum).optional(),
    pastBands: z.string().max(500).optional(),
    hasStudioExperience: z.boolean().optional()
});

export const updateLogisticsSchema = z
    .object({
        city: z.string().max(100),
        state: z.string().max(50).optional(),
        country: z.string().max(50),
        travelRadius: z.number().int().min(0).max(500).optional(),
        hasRehearsalSpace: z.boolean().optional(),
        hasTransportation: z.boolean().optional()
    })
    .refine(
        (data) => {
            if (data.country === 'USA' || data.country === 'Canada') {
                return !!data.state;
            }
            return true;
        },
        {
            message: 'State/province required for USA and Canada',
            path: ['state']
        }
    );

export const updateLookingForSchema = z.object({
    seeking: z.string().max(500).optional(),
    canOffer: z.string().max(500).optional(),
    dealBreakers: z.string().max(300).optional()
});

export const updateBioSchema = z.object({
    bio: z.string().max(500).optional(),
    musicalGoals: z.string().max(300).optional(),
    ageRange: z.string().max(20).optional()
});

export const completeSetupSchema = z.object({
    skipOptional: z.boolean().optional()
});

export const profileResponseSchema = z.object({
    success: z.boolean(),
    profileCompletion: z.number().int().min(0).max(100)
});

export const instrumentsSectionSchema = z.object({
    primaryInstrument: z.enum(InstrumentEnum).nullable(),
    yearsPlayingPrimary: z.number().nullable(),
    additionalInstruments: z.array(additionalInstrumentSchema),
    seekingToPlay: z.array(z.enum(InstrumentEnum))
});

export const genresSectionSchema = z.object({
    primaryGenre: z.enum(GenreEnum).nullable(),
    secondaryGenres: z.array(z.enum(GenreEnum)),
    influences: z.string().nullable()
});

export const availabilitySectionSchema = z.object({
    status: z.enum(AvailabilityStatusEnum).nullable(),
    statusExpiresAt: z.string().nullable(),
    commitmentLevel: z.enum(CommitmentLevelEnum).nullable(),
    weeklyAvailability: z.string().nullable(),
    rehearsalFrequency: z.enum(RehearsalFrequencyEnum).nullable()
});

export const experienceSectionSchema = z.object({
    giggingLevel: z.enum(GiggingLevelEnum).nullable(),
    pastBands: z.string().nullable(),
    hasStudioExperience: z.boolean().nullable()
});

export const logisticsSectionSchema = z.object({
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    travelRadius: z.number().nullable(),
    hasRehearsalSpace: z.boolean().nullable(),
    hasTransportation: z.boolean().nullable()
});

export const lookingForSectionSchema = z.object({
    seeking: z.string().nullable(),
    canOffer: z.string().nullable(),
    dealBreakers: z.string().nullable()
});

export const bioSectionSchema = z.object({
    bio: z.string().nullable(),
    musicalGoals: z.string().nullable(),
    ageRange: z.string().nullable()
});

export const fullProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    image: z.string().nullable(),
    lastActiveAt: z.string().nullable(),
    profileCompletion: z.number().int().min(0).max(100),
    instruments: instrumentsSectionSchema.nullable(),
    genres: genresSectionSchema.nullable(),
    availability: availabilitySectionSchema.nullable(),
    experience: experienceSectionSchema.nullable(),
    logistics: logisticsSectionSchema.nullable(),
    lookingFor: lookingForSectionSchema.nullable(),
    bio: bioSectionSchema.nullable()
});

export type AdditionalInstrument = z.infer<typeof additionalInstrumentSchema>;
export type UpdateInstruments = z.infer<typeof updateInstrumentsSchema>;
export type UpdateGenres = z.infer<typeof updateGenresSchema>;
export type UpdateAvailability = z.infer<typeof updateAvailabilitySchema>;
export type UpdateExperience = z.infer<typeof updateExperienceSchema>;
export type UpdateLogistics = z.infer<typeof updateLogisticsSchema>;
export type UpdateLookingFor = z.infer<typeof updateLookingForSchema>;
export type UpdateBio = z.infer<typeof updateBioSchema>;
export type CompleteSetup = z.infer<typeof completeSetupSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;
export type InstrumentsSection = z.infer<typeof instrumentsSectionSchema>;
export type GenresSection = z.infer<typeof genresSectionSchema>;
export type AvailabilitySection = z.infer<typeof availabilitySectionSchema>;
export type ExperienceSection = z.infer<typeof experienceSectionSchema>;
export type LogisticsSection = z.infer<typeof logisticsSectionSchema>;
export type LookingForSection = z.infer<typeof lookingForSectionSchema>;
export type BioSection = z.infer<typeof bioSectionSchema>;
export type FullProfile = z.infer<typeof fullProfileSchema>;
