import { eq, and, sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '@sound-connect/drizzle/schema';
import { calculateHaversineDistance } from '@sound-connect/common/utils/geo';
import type { MatchReason } from '@sound-connect/common/types/band-discovery';

const {
    postsTable,
    users,
    userProfilesTable,
    userAdditionalInstrumentsTable,
    userSettingsTable,
    blockedUsersTable,
    usersFollowersTable,
    bandsTable,
    bandsFollowersTable,
    bandsMembersTable
} = schema;

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

type BandProfile = {
    id: number;
    name: string;
    primaryGenre: string | null;
    lookingFor: string | null;
    latitude: number | null;
    longitude: number | null;
};

type ScoredPost = {
    postId: number;
    postContent: string;
    postCreatedAt: string;
    authorId: string | number;
    authorType: 'user' | 'band';
    matchScore: number;
    matchReasons: MatchReason[];
    finalScore: number;
};

const calculateRecencyMultiplier = (createdAt: string): number => {
    const now = new Date();
    const postDate = new Date(createdAt);
    const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 1) return 1.5;
    if (hoursDiff < 6) return 1.3;
    if (hoursDiff < 24) return 1.1;
    if (hoursDiff < 168) return 1.0;
    return 0.8;
};

const calculateUserMatchScore = (
    userProfile: UserProfile,
    additionalInstruments: AdditionalInstrument[],
    authorProfile: UserProfile,
    authorAdditionalInstruments: AdditionalInstrument[]
): { score: number; reasons: MatchReason[] } => {
    let score = 0;
    const reasons: MatchReason[] = [];

    const userInstruments = [userProfile.primaryInstrument, ...additionalInstruments.map((ai) => ai.instrument)].filter(
        (inst): inst is string => inst !== null
    );

    const authorInstruments = [authorProfile.primaryInstrument, ...authorAdditionalInstruments.map((ai) => ai.instrument)].filter(
        (inst): inst is string => inst !== null
    );

    for (const authorInst of authorInstruments) {
        if (userInstruments.includes(authorInst)) {
            const points = authorInst === authorProfile.primaryInstrument ? 50 : 25;
            score += points;
            reasons.push({ type: 'instrument', label: authorInst, points });
            break;
        }
    }

    const userSecondaryGenres = userProfile.secondaryGenres ? JSON.parse(userProfile.secondaryGenres) : [];
    const userGenres = [userProfile.primaryGenre, ...userSecondaryGenres].filter((g): g is string => g !== null);

    const authorSecondaryGenres = authorProfile.secondaryGenres ? JSON.parse(authorProfile.secondaryGenres) : [];
    const authorGenres = [authorProfile.primaryGenre, ...authorSecondaryGenres].filter((g): g is string => g !== null);

    for (const authorGenre of authorGenres) {
        if (userGenres.includes(authorGenre)) {
            const points = authorGenre === userProfile.primaryGenre ? 30 : 15;
            score += points;
            reasons.push({ type: 'genre', label: authorGenre, points });
            break;
        }
    }

    if (userProfile.latitude !== null && userProfile.longitude !== null && authorProfile.latitude !== null && authorProfile.longitude !== null) {
        const distance = calculateHaversineDistance(userProfile.latitude, userProfile.longitude, authorProfile.latitude, authorProfile.longitude);

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

const calculateBandMatchScore = (
    userProfile: UserProfile,
    additionalInstruments: AdditionalInstrument[],
    bandProfile: BandProfile
): { score: number; reasons: MatchReason[] } => {
    let score = 0;
    const reasons: MatchReason[] = [];

    const userSecondaryGenres = userProfile.secondaryGenres ? JSON.parse(userProfile.secondaryGenres) : [];
    const userGenres = [userProfile.primaryGenre, ...userSecondaryGenres].filter((g): g is string => g !== null);

    if (bandProfile.primaryGenre && userGenres.includes(bandProfile.primaryGenre)) {
        const points = bandProfile.primaryGenre === userProfile.primaryGenre ? 40 : 20;
        score += points;
        reasons.push({ type: 'genre', label: bandProfile.primaryGenre, points });
    }

    if (bandProfile.lookingFor) {
        const lookingForLower = bandProfile.lookingFor.toLowerCase();
        const userInstruments = [userProfile.primaryInstrument, ...additionalInstruments.map((ai) => ai.instrument)].filter(
            (inst): inst is string => inst !== null
        );

        for (const instrument of userInstruments) {
            if (lookingForLower.includes(instrument.toLowerCase())) {
                score += 30;
                reasons.push({ type: 'instrument', label: instrument, points: 30 });
                break;
            }
        }
    }

    if (userProfile.latitude !== null && userProfile.longitude !== null && bandProfile.latitude !== null && bandProfile.longitude !== null) {
        const distance = calculateHaversineDistance(userProfile.latitude, userProfile.longitude, bandProfile.latitude, bandProfile.longitude);

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

export const getDiscoveryPosts = async (db: DrizzleD1Database<typeof schema>, userId: string, limit: number = 10): Promise<ScoredPost[]> => {
    const [userProfile] = await db.select().from(userProfilesTable).where(eq(userProfilesTable.userId, userId)).limit(1);

    if (!userProfile) {
        return [];
    }

    const userAdditionalInstruments = await db
        .select({ instrument: userAdditionalInstrumentsTable.instrument })
        .from(userAdditionalInstrumentsTable)
        .where(eq(userAdditionalInstrumentsTable.userId, userId));

    const blockedByUser = await db.select({ blockedId: blockedUsersTable.blockedId }).from(blockedUsersTable).where(eq(blockedUsersTable.blockerId, userId));

    const blockedUser = await db.select({ blockerId: blockedUsersTable.blockerId }).from(blockedUsersTable).where(eq(blockedUsersTable.blockedId, userId));

    const blockedUserIds = [...blockedByUser.map((b) => b.blockedId), ...blockedUser.map((b) => b.blockerId)];

    const followedUsers = await db
        .select({ userId: usersFollowersTable.followedUserId })
        .from(usersFollowersTable)
        .where(eq(usersFollowersTable.userId, userId));

    const followedBands = await db.select({ bandId: bandsFollowersTable.bandId }).from(bandsFollowersTable).where(eq(bandsFollowersTable.followerId, userId));

    const ownBands = await db.select({ bandId: bandsMembersTable.bandId }).from(bandsMembersTable).where(eq(bandsMembersTable.userId, userId));

    const followedUserIds = followedUsers.map((f) => f.userId);
    const followedBandIds = [...followedBands.map((f) => f.bandId), ...ownBands.map((b) => b.bandId)];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    const candidateUserPosts = await db
        .select({
            postId: postsTable.id,
            postContent: postsTable.content,
            postCreatedAt: postsTable.createdAt,
            authorId: users.id,
            authorPrimaryInstrument: userProfilesTable.primaryInstrument,
            authorPrimaryGenre: userProfilesTable.primaryGenre,
            authorSecondaryGenres: userProfilesTable.secondaryGenres,
            authorCity: userProfilesTable.city,
            authorLatitude: userProfilesTable.latitude,
            authorLongitude: userProfilesTable.longitude,
            profileVisibility: userSettingsTable.profileVisibility,
            setupCompleted: userProfilesTable.setupCompleted
        })
        .from(postsTable)
        .innerJoin(users, eq(postsTable.userId, users.id))
        .innerJoin(userProfilesTable, eq(userProfilesTable.userId, users.id))
        .leftJoin(userSettingsTable, eq(userSettingsTable.userId, users.id))
        .where(
            and(
                eq(postsTable.authorType, 'user'),
                eq(postsTable.status, 'approved'),
                sql`${postsTable.createdAt} > ${sevenDaysAgoISO}`,
                sql`${users.id} != ${userId}`,
                eq(userProfilesTable.setupCompleted, true)
            )
        )
        .limit(100);

    const filteredUserPosts = candidateUserPosts.filter((post) => {
        if (blockedUserIds.includes(post.authorId)) return false;
        if (followedUserIds.includes(post.authorId)) return false;
        if (post.profileVisibility && post.profileVisibility !== 'public') return false;
        return true;
    });

    const scoredUserPosts: ScoredPost[] = [];

    for (const post of filteredUserPosts) {
        const authorAdditionalInstruments = await db
            .select({ instrument: userAdditionalInstrumentsTable.instrument })
            .from(userAdditionalInstrumentsTable)
            .where(eq(userAdditionalInstrumentsTable.userId, post.authorId));

        const authorProfile: UserProfile = {
            userId: post.authorId,
            primaryInstrument: post.authorPrimaryInstrument,
            primaryGenre: post.authorPrimaryGenre,
            secondaryGenres: post.authorSecondaryGenres,
            city: post.authorCity,
            latitude: post.authorLatitude,
            longitude: post.authorLongitude
        };

        const { score, reasons } = calculateUserMatchScore(userProfile, userAdditionalInstruments, authorProfile, authorAdditionalInstruments);

        if (score >= 20) {
            const recencyMultiplier = calculateRecencyMultiplier(post.postCreatedAt);
            const finalScore = score * recencyMultiplier;

            scoredUserPosts.push({
                postId: post.postId,
                postContent: post.postContent,
                postCreatedAt: post.postCreatedAt,
                authorId: post.authorId,
                authorType: 'user',
                matchScore: score,
                matchReasons: reasons,
                finalScore
            });
        }
    }

    const candidateBandPosts = await db
        .select({
            postId: postsTable.id,
            postContent: postsTable.content,
            postCreatedAt: postsTable.createdAt,
            bandId: bandsTable.id,
            bandName: bandsTable.name,
            bandPrimaryGenre: bandsTable.primaryGenre,
            bandLookingFor: bandsTable.lookingFor,
            bandLatitude: bandsTable.latitude,
            bandLongitude: bandsTable.longitude
        })
        .from(postsTable)
        .innerJoin(bandsTable, eq(postsTable.bandId, bandsTable.id))
        .where(and(eq(postsTable.authorType, 'band'), eq(postsTable.status, 'approved'), sql`${postsTable.createdAt} > ${sevenDaysAgoISO}`))
        .limit(100);

    const filteredBandPosts = candidateBandPosts.filter((post) => {
        if (followedBandIds.includes(post.bandId)) return false;
        return true;
    });

    const scoredBandPosts: ScoredPost[] = [];

    for (const post of filteredBandPosts) {
        const bandProfile: BandProfile = {
            id: post.bandId,
            name: post.bandName,
            primaryGenre: post.bandPrimaryGenre,
            lookingFor: post.bandLookingFor,
            latitude: post.bandLatitude,
            longitude: post.bandLongitude
        };

        const { score, reasons } = calculateBandMatchScore(userProfile, userAdditionalInstruments, bandProfile);

        if (score >= 20) {
            const recencyMultiplier = calculateRecencyMultiplier(post.postCreatedAt);
            const finalScore = score * recencyMultiplier;

            scoredBandPosts.push({
                postId: post.postId,
                postContent: post.postContent,
                postCreatedAt: post.postCreatedAt,
                authorId: post.bandId,
                authorType: 'band',
                matchScore: score,
                matchReasons: reasons,
                finalScore
            });
        }
    }

    const allScoredPosts = [...scoredUserPosts, ...scoredBandPosts];
    allScoredPosts.sort((a, b) => b.finalScore - a.finalScore);

    return allScoredPosts.slice(0, limit);
};
