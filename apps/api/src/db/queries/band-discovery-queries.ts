import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql, isNotNull, inArray, desc, asc } from 'drizzle-orm';
import {
    bandsTable,
    bandsMembersTable,
    bandsFollowersTable,
    userProfilesTable,
    userAdditionalInstrumentsTable,
    discoveryAnalyticsTable,
    users
} from '@sound-connect/drizzle/schema';
import { calculateHaversineDistance } from '@sound-connect/common/utils/geo';
import type { BandDiscoveryParams, MatchReason, BandMemberPreview } from '@sound-connect/common/types/band-discovery';
import type { DiscoveryAnalyticsEvent } from '@sound-connect/common/types/band-discovery';

type BandWithCounts = {
    id: number;
    name: string;
    username: string | null;
    profileImageUrl: string | null;
    primaryGenre: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    lookingFor: string | null;
    latitude: number | null;
    longitude: number | null;
    memberCount: number;
    followerCount: number;
};

type UserProfile = {
    userId: string;
    primaryInstrument: string | null;
    primaryGenre: string | null;
    secondaryGenres: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
};

type AdditionalInstrument = {
    instrument: string;
};

export const getUserProfileWithInstruments = async (db: D1Database, userId: string) => {
    const [profile] = await drizzle(db).select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!profile) {
        return null;
    }

    const additionalInstruments = await drizzle(db)
        .select({ instrument: userAdditionalInstrumentsTable.instrument })
        .from(userAdditionalInstrumentsTable)
        .where(eq(userAdditionalInstrumentsTable.userId, userId));

    return {
        profile,
        additionalInstruments
    };
};

const calculateMatchScore = (
    userProfile: UserProfile,
    additionalInstruments: AdditionalInstrument[],
    band: BandWithCounts
): { score: number; reasons: MatchReason[] } => {
    let score = 0;
    const reasons: MatchReason[] = [];

    if (!band.lookingFor) {
        return { score: 0, reasons: [] };
    }

    const lookingForLower = band.lookingFor.toLowerCase();

    const userInstruments = [userProfile.primaryInstrument, ...additionalInstruments.map((ai) => ai.instrument)].filter(
        (inst): inst is string => inst !== null
    );

    for (const instrument of userInstruments) {
        if (lookingForLower.includes(instrument.toLowerCase())) {
            const points = instrument === userProfile.primaryInstrument ? 50 : 25;
            score += points;
            reasons.push({ type: 'instrument', label: instrument, points });
            break;
        }
    }

    const secondaryGenres = userProfile.secondaryGenres ? JSON.parse(userProfile.secondaryGenres) : [];
    const userGenres = [userProfile.primaryGenre, ...secondaryGenres].filter((g): g is string => g !== null);

    if (band.primaryGenre && userGenres.includes(band.primaryGenre)) {
        const points = band.primaryGenre === userProfile.primaryGenre ? 30 : 15;
        score += points;
        reasons.push({ type: 'genre', label: band.primaryGenre, points });
    }

    if (userProfile.latitude !== null && userProfile.longitude !== null && band.latitude !== null && band.longitude !== null) {
        const distance = calculateHaversineDistance(userProfile.latitude, userProfile.longitude, band.latitude, band.longitude);

        let points = 0;
        if (distance < 10) {
            points = 20;
        } else if (distance < 25) {
            points = 10;
        } else if (distance < 50) {
            points = 5;
        }

        if (points > 0) {
            score += points;
            reasons.push({
                type: 'location',
                label: `${Math.round(distance)} miles away`,
                points
            });
        }
    }

    return { score, reasons };
};

export const discoverBands = async (db: D1Database, userId: string, params: BandDiscoveryParams) => {
    const profileData = await getUserProfileWithInstruments(db, userId);

    if (!profileData) {
        throw new Error('Profile not found');
    }

    const { profile, additionalInstruments } = profileData;

    if (!profile.primaryInstrument || !profile.primaryGenre || !profile.city) {
        throw new Error('Profile incomplete');
    }

    const memberCountSubquery = drizzle(db)
        .select({
            bandId: bandsMembersTable.bandId,
            count: sql<number>`COUNT(*)`.as('member_count')
        })
        .from(bandsMembersTable)
        .groupBy(bandsMembersTable.bandId)
        .as('member_counts');

    const followerCountSubquery = drizzle(db)
        .select({
            bandId: bandsFollowersTable.bandId,
            count: sql<number>`COUNT(*)`.as('follower_count')
        })
        .from(bandsFollowersTable)
        .groupBy(bandsFollowersTable.bandId)
        .as('follower_counts');

    const bands = await drizzle(db)
        .select({
            id: bandsTable.id,
            name: bandsTable.name,
            username: bandsTable.username,
            profileImageUrl: bandsTable.profileImageUrl,
            primaryGenre: bandsTable.primaryGenre,
            city: bandsTable.city,
            state: bandsTable.state,
            country: bandsTable.country,
            lookingFor: bandsTable.lookingFor,
            latitude: bandsTable.latitude,
            longitude: bandsTable.longitude,
            memberCount: sql<number>`COALESCE(${memberCountSubquery.count}, 0)`,
            followerCount: sql<number>`COALESCE(${followerCountSubquery.count}, 0)`
        })
        .from(bandsTable)
        .leftJoin(memberCountSubquery, eq(bandsTable.id, memberCountSubquery.bandId))
        .leftJoin(followerCountSubquery, eq(bandsTable.id, followerCountSubquery.bandId))
        .where(and(isNotNull(bandsTable.lookingFor), sql`${bandsTable.lookingFor} != ''`));

    const bandsWithScores = bands
        .map((band) => {
            const { score, reasons } = calculateMatchScore(profile as UserProfile, additionalInstruments, band);

            const distance =
                profile.latitude !== null && profile.longitude !== null && band.latitude !== null && band.longitude !== null
                    ? calculateHaversineDistance(profile.latitude, profile.longitude, band.latitude, band.longitude)
                    : 0;

            return {
                id: band.id,
                name: band.name,
                username: band.username,
                profileImageUrl: band.profileImageUrl,
                primaryGenre: band.primaryGenre,
                city: band.city,
                state: band.state,
                country: band.country,
                lookingFor: band.lookingFor,
                distanceMiles: Math.round(distance),
                matchScore: score,
                matchReasons: reasons.slice(0, 2),
                followerCount: band.followerCount,
                memberCount: band.memberCount
            };
        })
        .filter((band) => band.matchScore >= 20)
        .sort((a, b) => b.matchScore - a.matchScore);

    const total = bandsWithScores.length;
    const offset = (params.page - 1) * params.limit;
    const paginatedBands = bandsWithScores.slice(offset, offset + params.limit);

    const totalPages = Math.ceil(total / params.limit);

    const bandIds = paginatedBands.map((b) => b.id);

    let membersByBand: Record<number, BandMemberPreview[]> = {};

    if (bandIds.length > 0) {
        const members = await drizzle(db)
            .select({
                bandId: bandsMembersTable.bandId,
                userId: bandsMembersTable.userId,
                name: users.name,
                profileImageUrl: users.image
            })
            .from(bandsMembersTable)
            .innerJoin(users, eq(bandsMembersTable.userId, users.id))
            .where(inArray(bandsMembersTable.bandId, bandIds))
            .orderBy(desc(bandsMembersTable.isAdmin), asc(bandsMembersTable.joinedAt));

        membersByBand = members.reduce(
            (acc, member) => {
                const bandId = member.bandId;
                if (!acc[bandId]) {
                    acc[bandId] = [];
                }
                if (acc[bandId].length < 4) {
                    acc[bandId].push({
                        id: member.userId,
                        name: member.name,
                        profileImageUrl: member.profileImageUrl
                    });
                }
                return acc;
            },
            {} as Record<number, BandMemberPreview[]>
        );
    }

    return {
        bands: paginatedBands.map((band) => ({
            ...band,
            members: membersByBand[band.id] || []
        })),
        pagination: {
            currentPage: params.page,
            totalPages,
            totalResults: total,
            hasNextPage: params.page < totalPages,
            hasPreviousPage: params.page > 1
        }
    };
};

export const trackDiscoveryEvent = async (db: D1Database, userId: string, event: DiscoveryAnalyticsEvent) => {
    const matchFactorsJson = event.matchReasons ? JSON.stringify(event.matchReasons) : null;

    await drizzle(db)
        .insert(discoveryAnalyticsTable)
        .values({
            userId,
            sessionId: event.sessionId,
            eventType: event.eventType,
            bandId: event.bandId ?? null,
            matchScore: event.matchScore ?? null,
            matchFactors: matchFactorsJson,
            positionInFeed: event.positionInFeed ?? null,
            pageNumber: event.pageNumber ?? null,
            createdAt: new Date().toISOString()
        });
};
