import { schema } from '@/drizzle';
import { eq, and, count as drizzleCount, sql, isNotNull } from 'drizzle-orm';
import { db } from '../index';

const { bandsFollowersTable, users, userProfilesTable, bandsTable } = schema;

export const followBand = async (bandId: number, userId: string) => {
    const now = new Date().toISOString();

    const [existing] = await db
        .select()
        .from(bandsFollowersTable)
        .where(and(eq(bandsFollowersTable.bandId, bandId), eq(bandsFollowersTable.followerId, userId)))
        .limit(1);

    if (existing) {
        return {
            followerId: existing.followerId,
            bandId: existing.bandId,
            createdAt: existing.createdAt
        };
    }

    const [follow] = await db
        .insert(bandsFollowersTable)
        .values({
            bandId,
            followerId: userId,
            createdAt: now
        })
        .returning();

    if (!follow) {
        throw new Error('Failed to follow band');
    }

    return {
        followerId: follow.followerId,
        bandId: follow.bandId,
        createdAt: follow.createdAt
    };
};

export const unfollowBand = async (bandId: number, userId: string) => {
    await db.delete(bandsFollowersTable).where(and(eq(bandsFollowersTable.bandId, bandId), eq(bandsFollowersTable.followerId, userId)));
};

export const getBandFollowers = async (bandId: number, page: number = 1, limit: number = 50) => {
    const offset = (page - 1) * limit;

    const followers = await db
        .select({
            userId: users.id,
            username: users.username,
            name: users.name,
            profileImageUrl: users.image,
            primaryInstrument: userProfilesTable.primaryInstrument,
            createdAt: bandsFollowersTable.createdAt
        })
        .from(bandsFollowersTable)
        .innerJoin(users, eq(bandsFollowersTable.followerId, users.id))
        .leftJoin(userProfilesTable, eq(users.id, userProfilesTable.userId))
        .where(and(eq(bandsFollowersTable.bandId, bandId), isNotNull(users.username)))
        .orderBy(sql`${bandsFollowersTable.createdAt} DESC`)
        .limit(limit)
        .offset(offset);

    const [totalResult] = await db.select({ count: drizzleCount() }).from(bandsFollowersTable).where(eq(bandsFollowersTable.bandId, bandId));

    const total = totalResult?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
        followers: followers.map((f) => ({
            userId: f.userId,
            username: f.username as string,
            name: f.name,
            profileImageUrl: f.profileImageUrl,
            primaryInstrument: f.primaryInstrument,
            createdAt: f.createdAt
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages
        }
    };
};

export const getBandFollowerCount = async (bandId: number) => {
    const [result] = await db.select({ count: drizzleCount() }).from(bandsFollowersTable).where(eq(bandsFollowersTable.bandId, bandId));

    return result?.count ?? 0;
};

export const isFollowingBand = async (bandId: number, userId: string) => {
    const [result] = await db
        .select({ id: bandsFollowersTable.id })
        .from(bandsFollowersTable)
        .where(and(eq(bandsFollowersTable.bandId, bandId), eq(bandsFollowersTable.followerId, userId)))
        .limit(1);

    return Boolean(result);
};

export const getBandAdmins = async (bandId: number) => {
    const { bandsMembersTable } = schema;

    const admins = await db
        .select({
            userId: users.id,
            name: users.name,
            profileImageUrl: users.image
        })
        .from(bandsMembersTable)
        .innerJoin(users, eq(bandsMembersTable.userId, users.id))
        .where(and(eq(bandsMembersTable.bandId, bandId), eq(bandsMembersTable.isAdmin, true)));

    return admins.map((a) => ({
        userId: a.userId,
        name: a.name,
        profileImageUrl: a.profileImageUrl
    }));
};

export const bandExists = async (bandId: number) => {
    const [result] = await db.select({ id: bandsTable.id }).from(bandsTable).where(eq(bandsTable.id, bandId)).limit(1);

    return Boolean(result);
};
