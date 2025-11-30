import { schema } from '@/drizzle';
import { eq, sql } from 'drizzle-orm';
import { db } from '../index';
import { calculateProfileCompletion } from '@/common/utils/profile-completion';
import type { Instrument, Genre, AvailabilityStatus, CommitmentLevel, RehearsalFrequency, GiggingLevel } from '@/common/types/profile-enums';
import { isReservedUsername } from '@sound-connect/common/reserved-usernames';
import { getUserByUsername } from './users-queries';
import { getBandByUsername } from './bands-queries';
import type { ProfileLookupResult } from '@/common/types/profile-lookup';

const { users, userProfilesTable, userAdditionalInstrumentsTable, bandsTable } = schema;

const autoCompleteSetupIfReady = async (userId: string) => {
    const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!profile) return;

    if (profile.setupCompleted) return;

    const hasRequiredFields = profile.city && profile.primaryInstrument && profile.primaryGenre;

    if (hasRequiredFields) {
        await db
            .update(userProfilesTable)
            .set({
                setupCompleted: true,
                updatedAt: new Date().toISOString()
            })
            .where(eq(userProfilesTable.userId, userId));
    }
};

export const getOrCreateUserProfile = async (userId: string) => {
    const [existingProfile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (existingProfile) {
        return existingProfile;
    }

    const [newProfile] = await db
        .insert(userProfilesTable)
        .values({
            userId,
            profileCompletion: 0,
            setupCompleted: false,
            createdAt: new Date().toISOString()
        })
        .returning();

    return newProfile;
};

export const updateUserProfileInstruments = async (
    userId: string,
    data: {
        primaryInstrument: Instrument;
        yearsPlayingPrimary: number;
        additionalInstruments: { instrument: Instrument; years: number }[];
        seekingToPlay: Instrument[];
    }
) => {
    await getOrCreateUserProfile(userId);

    await db.delete(userAdditionalInstrumentsTable).where(eq(userAdditionalInstrumentsTable.userId, userId));

    if (data.additionalInstruments.length > 0) {
        await db.insert(userAdditionalInstrumentsTable).values(
            data.additionalInstruments.map((inst) => ({
                userId,
                instrument: inst.instrument,
                years: inst.years,
                createdAt: new Date().toISOString()
            }))
        );
    }

    const seekingToPlayJson = JSON.stringify(data.seekingToPlay);

    await db
        .update(userProfilesTable)
        .set({
            primaryInstrument: data.primaryInstrument,
            yearsPlayingPrimary: data.yearsPlayingPrimary,
            seekingToPlay: seekingToPlayJson,
            updatedAt: new Date().toISOString()
        })
        .where(eq(userProfilesTable.userId, userId));

    const [updatedProfile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!updatedProfile) {
        throw new Error('Profile not found after update');
    }

    const profileCompletion = calculateProfileCompletion(updatedProfile);

    await db.update(userProfilesTable).set({ profileCompletion }).where(eq(userProfilesTable.userId, userId));

    await autoCompleteSetupIfReady(userId);

    return profileCompletion;
};

export const updateUserProfileGenres = async (
    userId: string,
    data: {
        primaryGenre: Genre;
        secondaryGenres?: Genre[];
        influences?: string;
    }
) => {
    await getOrCreateUserProfile(userId);

    const secondaryGenresJson = data.secondaryGenres ? JSON.stringify(data.secondaryGenres) : null;

    await db
        .update(userProfilesTable)
        .set({
            primaryGenre: data.primaryGenre,
            secondaryGenres: secondaryGenresJson,
            influences: data.influences || null,
            updatedAt: new Date().toISOString()
        })
        .where(eq(userProfilesTable.userId, userId));

    const [updatedProfile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!updatedProfile) {
        throw new Error('Profile not found after update');
    }

    const profileCompletion = calculateProfileCompletion(updatedProfile);

    await db.update(userProfilesTable).set({ profileCompletion }).where(eq(userProfilesTable.userId, userId));

    await autoCompleteSetupIfReady(userId);

    return profileCompletion;
};

export const updateUserProfileAvailability = async (
    userId: string,
    data: {
        status: AvailabilityStatus;
        commitmentLevel?: CommitmentLevel;
        weeklyAvailability?: string;
        rehearsalFrequency?: RehearsalFrequency;
    }
) => {
    await getOrCreateUserProfile(userId);

    await db
        .update(userProfilesTable)
        .set({
            status: data.status,
            commitmentLevel: data.commitmentLevel || null,
            weeklyAvailability: data.weeklyAvailability || null,
            rehearsalFrequency: data.rehearsalFrequency || null,
            updatedAt: new Date().toISOString()
        })
        .where(eq(userProfilesTable.userId, userId));

    const [updatedProfile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!updatedProfile) {
        throw new Error('Profile not found after update');
    }

    const profileCompletion = calculateProfileCompletion(updatedProfile);

    await db.update(userProfilesTable).set({ profileCompletion }).where(eq(userProfilesTable.userId, userId));

    return profileCompletion;
};

export const updateUserProfileExperience = async (
    userId: string,
    data: {
        giggingLevel?: GiggingLevel;
        pastBands?: string;
        hasStudioExperience?: boolean;
    }
) => {
    await getOrCreateUserProfile(userId);

    await db
        .update(userProfilesTable)
        .set({
            giggingLevel: data.giggingLevel || null,
            pastBands: data.pastBands || null,
            hasStudioExperience: data.hasStudioExperience ?? null,
            updatedAt: new Date().toISOString()
        })
        .where(eq(userProfilesTable.userId, userId));

    const [updatedProfile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!updatedProfile) {
        throw new Error('Profile not found after update');
    }

    const profileCompletion = calculateProfileCompletion(updatedProfile);

    await db.update(userProfilesTable).set({ profileCompletion }).where(eq(userProfilesTable.userId, userId));

    return profileCompletion;
};

export const updateUserProfileLogistics = async (
    userId: string,
    data: {
        city: string;
        state?: string;
        country: string;
        latitude: number;
        longitude: number;
        travelRadius?: number;
        hasRehearsalSpace?: boolean;
        hasTransportation?: boolean;
    }
) => {
    await getOrCreateUserProfile(userId);

    const updateData = {
        city: data.city.trim(),
        state: data.state || null,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        travelRadius: data.travelRadius ?? null,
        hasRehearsalSpace: data.hasRehearsalSpace ?? null,
        hasTransportation: data.hasTransportation ?? null,
        updatedAt: new Date().toISOString()
    };

    await db.update(userProfilesTable).set(updateData).where(eq(userProfilesTable.userId, userId));

    const [updatedProfile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!updatedProfile) {
        throw new Error('Profile not found after update');
    }

    const profileCompletion = calculateProfileCompletion(updatedProfile);

    await db.update(userProfilesTable).set({ profileCompletion }).where(eq(userProfilesTable.userId, userId));

    await autoCompleteSetupIfReady(userId);

    return profileCompletion;
};

export const updateUserProfileLookingFor = async (
    userId: string,
    data: {
        seeking?: string;
        canOffer?: string;
        dealBreakers?: string;
    }
) => {
    await getOrCreateUserProfile(userId);

    await db
        .update(userProfilesTable)
        .set({
            seeking: data.seeking || null,
            canOffer: data.canOffer || null,
            dealBreakers: data.dealBreakers || null,
            updatedAt: new Date().toISOString()
        })
        .where(eq(userProfilesTable.userId, userId));

    const [updatedProfile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!updatedProfile) {
        throw new Error('Profile not found after update');
    }

    const profileCompletion = calculateProfileCompletion(updatedProfile);

    await db.update(userProfilesTable).set({ profileCompletion }).where(eq(userProfilesTable.userId, userId));

    return profileCompletion;
};

export const updateUserProfileBio = async (
    userId: string,
    data: {
        bio?: string;
    }
) => {
    await getOrCreateUserProfile(userId);

    await db
        .update(userProfilesTable)
        .set({
            bio: data.bio || null,
            updatedAt: new Date().toISOString()
        })
        .where(eq(userProfilesTable.userId, userId));

    const [updatedProfile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!updatedProfile) {
        throw new Error('Profile not found after update');
    }

    const profileCompletion = calculateProfileCompletion(updatedProfile);

    await db.update(userProfilesTable).set({ profileCompletion }).where(eq(userProfilesTable.userId, userId));

    return profileCompletion;
};

export const completeUserProfileSetup = async (userId: string) => {
    const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!profile) {
        throw new Error('Profile not found');
    }

    const hasRequiredFields = profile.city && profile.primaryInstrument && profile.primaryGenre;

    if (!hasRequiredFields) {
        throw new Error('Required fields not completed');
    }

    await db
        .update(userProfilesTable)
        .set({
            setupCompleted: true,
            updatedAt: new Date().toISOString()
        })
        .where(eq(userProfilesTable.userId, userId));

    return profile.profileCompletion;
};

export const getUserProfile = async (userId: string) => {
    const [user] = await db
        .select({
            id: users.id,
            name: users.name,
            username: users.username,
            image: users.image,
            backgroundImage: users.backgroundImage,
            lastActiveAt: users.lastActiveAt
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        return null;
    }

    const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    const additionalInstruments = await db
        .select({
            instrument: userAdditionalInstrumentsTable.instrument,
            years: userAdditionalInstrumentsTable.years
        })
        .from(userAdditionalInstrumentsTable)
        .where(eq(userAdditionalInstrumentsTable.userId, userId));

    if (!profile) {
        return {
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image,
            backgroundImage: user.backgroundImage,
            lastActiveAt: user.lastActiveAt,
            profileCompletion: 0,
            instruments: null,
            genres: null,
            availability: null,
            experience: null,
            logistics: null,
            lookingFor: null,
            bio: null
        };
    }

    const seekingToPlay = profile.seekingToPlay ? JSON.parse(profile.seekingToPlay) : [];
    const secondaryGenres = profile.secondaryGenres ? JSON.parse(profile.secondaryGenres) : [];

    return {
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        backgroundImage: user.backgroundImage,
        lastActiveAt: user.lastActiveAt,
        profileCompletion: profile.profileCompletion,
        instruments: profile.primaryInstrument
            ? {
                  primaryInstrument: profile.primaryInstrument,
                  yearsPlayingPrimary: profile.yearsPlayingPrimary,
                  additionalInstruments,
                  seekingToPlay
              }
            : null,
        genres: profile.primaryGenre
            ? {
                  primaryGenre: profile.primaryGenre,
                  secondaryGenres,
                  influences: profile.influences
              }
            : null,
        availability: profile.status
            ? {
                  status: profile.status,
                  commitmentLevel: profile.commitmentLevel,
                  weeklyAvailability: profile.weeklyAvailability,
                  rehearsalFrequency: profile.rehearsalFrequency
              }
            : null,
        experience:
            profile.giggingLevel || profile.pastBands || profile.hasStudioExperience !== null
                ? {
                      giggingLevel: profile.giggingLevel,
                      pastBands: profile.pastBands,
                      hasStudioExperience: profile.hasStudioExperience
                  }
                : null,
        logistics: profile.city
            ? {
                  city: profile.city,
                  state: profile.state,
                  country: profile.country,
                  latitude: profile.latitude,
                  longitude: profile.longitude,
                  travelRadius: profile.travelRadius,
                  hasRehearsalSpace: profile.hasRehearsalSpace,
                  hasTransportation: profile.hasTransportation
              }
            : null,
        lookingFor:
            profile.seeking || profile.canOffer || profile.dealBreakers
                ? {
                      seeking: profile.seeking,
                      canOffer: profile.canOffer,
                      dealBreakers: profile.dealBreakers
                  }
                : null,
        bio: profile.bio
            ? {
                  bio: profile.bio
              }
            : null
    };
};

export const lookupProfileByUsername = async (username: string): Promise<ProfileLookupResult | null> => {
    const normalized = username.toLowerCase();

    const user = await getUserByUsername(normalized);
    if (user) {
        const fullProfile = await getUserFullProfile(user.id);
        if (!fullProfile) {
            return null;
        }
        return {
            type: 'user',
            data: fullProfile
        };
    }

    const band = await getBandByUsername(normalized);
    if (band) {
        return {
            type: 'band',
            data: band
        };
    }

    return null;
};

export const isUsernameGloballyAvailable = async (
    username: string,
    excludeUserId?: string,
    excludeBandId?: number
): Promise<{ available: boolean; takenBy: 'user' | 'band' | 'reserved' | null }> => {
    const normalized = username.toLowerCase();

    if (isReservedUsername(normalized)) {
        return { available: false, takenBy: 'reserved' };
    }

    let userCondition = sql`LOWER(${users.username}) = ${normalized}`;
    if (excludeUserId) {
        userCondition = sql`${userCondition} AND ${users.id} != ${excludeUserId}`;
    }

    const [existingUser] = await db.select({ id: users.id }).from(users).where(userCondition).limit(1);

    if (existingUser) {
        return { available: false, takenBy: 'user' };
    }

    let bandCondition = sql`LOWER(${bandsTable.username}) = ${normalized}`;
    if (excludeBandId) {
        bandCondition = sql`${bandCondition} AND ${bandsTable.id} != ${excludeBandId}`;
    }

    const [existingBand] = await db.select({ id: bandsTable.id }).from(bandsTable).where(bandCondition).limit(1);

    if (existingBand) {
        return { available: false, takenBy: 'band' };
    }

    return { available: true, takenBy: null };
};

const getUserFullProfile = async (userId: string) => {
    const [user] = await db
        .select({
            id: users.id,
            name: users.name,
            username: users.username,
            image: users.image,
            backgroundImage: users.backgroundImage,
            lastActiveAt: users.lastActiveAt
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        return null;
    }

    const [profile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!profile) {
        return null;
    }

    const additionalInstruments = await db
        .select({
            instrument: userAdditionalInstrumentsTable.instrument,
            years: userAdditionalInstrumentsTable.years
        })
        .from(userAdditionalInstrumentsTable)
        .where(eq(userAdditionalInstrumentsTable.userId, userId));

    const seekingToPlay = profile.seekingToPlay ? JSON.parse(profile.seekingToPlay) : [];
    const secondaryGenres = profile.secondaryGenres ? JSON.parse(profile.secondaryGenres) : [];

    return {
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        backgroundImage: user.backgroundImage,
        lastActiveAt: user.lastActiveAt,
        profileCompletion: profile.profileCompletion,
        instruments: profile.primaryInstrument
            ? {
                  primaryInstrument: profile.primaryInstrument,
                  yearsPlayingPrimary: profile.yearsPlayingPrimary,
                  additionalInstruments,
                  seekingToPlay
              }
            : null,
        genres: profile.primaryGenre
            ? {
                  primaryGenre: profile.primaryGenre,
                  secondaryGenres,
                  influences: profile.influences
              }
            : null,
        availability: profile.status
            ? {
                  status: profile.status,
                  commitmentLevel: profile.commitmentLevel,
                  weeklyAvailability: profile.weeklyAvailability,
                  rehearsalFrequency: profile.rehearsalFrequency
              }
            : null,
        experience:
            profile.giggingLevel || profile.pastBands || profile.hasStudioExperience !== null
                ? {
                      giggingLevel: profile.giggingLevel,
                      pastBands: profile.pastBands,
                      hasStudioExperience: profile.hasStudioExperience
                  }
                : null,
        logistics: profile.city
            ? {
                  city: profile.city,
                  state: profile.state,
                  country: profile.country,
                  latitude: profile.latitude,
                  longitude: profile.longitude,
                  travelRadius: profile.travelRadius,
                  hasRehearsalSpace: profile.hasRehearsalSpace,
                  hasTransportation: profile.hasTransportation
              }
            : null,
        lookingFor:
            profile.seeking || profile.canOffer || profile.dealBreakers
                ? {
                      seeking: profile.seeking,
                      canOffer: profile.canOffer,
                      dealBreakers: profile.dealBreakers
                  }
                : null,
        bio: profile.bio
            ? {
                  bio: profile.bio
              }
            : null
    };
};
