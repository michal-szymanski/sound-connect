import { schema } from '@/drizzle';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { CreateBandInput, UpdateBandInput, Band, BandWithMembers, BandMembership } from '@sound-connect/common/types/bands';
import { db } from '../index';

const { musicGroupsTable, musicGroupMembersTable, users } = schema;

export const createBand = async (data: CreateBandInput & { latitude: number; longitude: number }, userId: string): Promise<Band> => {
    const now = new Date().toISOString();

    const [band] = await db
        .insert(musicGroupsTable)
        .values({
            name: data.name,
            description: data.description,
            primaryGenre: data.primaryGenre,
            city: data.city,
            state: data.state,
            country: data.country,
            latitude: data.latitude,
            longitude: data.longitude,
            lookingFor: data.lookingFor ?? null,
            profileImageUrl: null,
            createdAt: now,
            updatedAt: null
        })
        .returning();

    if (!band) {
        throw new Error('Failed to create band');
    }

    await db.insert(musicGroupMembersTable).values({
        userId,
        musicGroupId: band.id,
        isAdmin: true,
        joinedAt: now
    });

    return band;
};

export const getBandById = async (bandId: number, currentUserId?: string): Promise<BandWithMembers | null> => {
    const [band] = await db.select().from(musicGroupsTable).where(eq(musicGroupsTable.id, bandId)).limit(1);

    if (!band) {
        return null;
    }

    const membersResults = await db
        .select({
            userId: musicGroupMembersTable.userId,
            name: users.name,
            profileImageUrl: users.image,
            isAdmin: musicGroupMembersTable.isAdmin,
            joinedAt: musicGroupMembersTable.joinedAt
        })
        .from(musicGroupMembersTable)
        .innerJoin(users, eq(musicGroupMembersTable.userId, users.id))
        .where(eq(musicGroupMembersTable.musicGroupId, bandId))
        .orderBy(desc(musicGroupMembersTable.isAdmin), musicGroupMembersTable.joinedAt);

    const members = membersResults.map((m) => ({
        userId: m.userId,
        name: m.name,
        profileImageUrl: m.profileImageUrl,
        isAdmin: Boolean(m.isAdmin),
        joinedAt: m.joinedAt
    }));

    let isUserAdmin: boolean | undefined = undefined;
    if (currentUserId) {
        const adminCheck = members.find((m) => m.userId === currentUserId);
        isUserAdmin = adminCheck?.isAdmin ?? false;
    }

    return {
        ...band,
        members,
        isUserAdmin
    };
};

export const updateBand = async (bandId: number, data: UpdateBandInput & { latitude?: number; longitude?: number }): Promise<Band> => {
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
        updatedAt: now
    };

    if (data.name !== undefined) updateData['name'] = data.name;
    if (data.description !== undefined) updateData['description'] = data.description;
    if (data.city !== undefined) updateData['city'] = data.city;
    if (data.state !== undefined) updateData['state'] = data.state;
    if (data.country !== undefined) updateData['country'] = data.country;
    if (data.primaryGenre !== undefined) updateData['primaryGenre'] = data.primaryGenre;
    if (data.lookingFor !== undefined) updateData['lookingFor'] = data.lookingFor;
    if (data.latitude !== undefined) updateData['latitude'] = data.latitude;
    if (data.longitude !== undefined) updateData['longitude'] = data.longitude;

    const [updated] = await db.update(musicGroupsTable).set(updateData).where(eq(musicGroupsTable.id, bandId)).returning();

    if (!updated) {
        throw new Error('Failed to update band');
    }

    return updated;
};

export const deleteBand = async (bandId: number): Promise<void> => {
    await db.delete(musicGroupsTable).where(eq(musicGroupsTable.id, bandId));
};

export const isBandAdmin = async (bandId: number, userId: string): Promise<boolean> => {
    const [result] = await db
        .select({ isAdmin: musicGroupMembersTable.isAdmin })
        .from(musicGroupMembersTable)
        .where(and(eq(musicGroupMembersTable.musicGroupId, bandId), eq(musicGroupMembersTable.userId, userId)))
        .limit(1);

    return result ? Boolean(result.isAdmin) : false;
};

export const addBandMember = async (
    bandId: number,
    userId: string
): Promise<{ userId: string; name: string; profileImageUrl: string | null; isAdmin: boolean; joinedAt: string }> => {
    const now = new Date().toISOString();

    await db.insert(musicGroupMembersTable).values({
        userId,
        musicGroupId: bandId,
        isAdmin: false,
        joinedAt: now
    });

    const [user] = await db
        .select({
            id: users.id,
            name: users.name,
            image: users.image
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        throw new Error('User not found');
    }

    return {
        userId: user.id,
        name: user.name,
        profileImageUrl: user.image,
        isAdmin: false,
        joinedAt: now
    };
};

export const removeBandMember = async (bandId: number, userId: string): Promise<void> => {
    await db.delete(musicGroupMembersTable).where(and(eq(musicGroupMembersTable.musicGroupId, bandId), eq(musicGroupMembersTable.userId, userId)));
};

export const isBandMember = async (bandId: number, userId: string): Promise<boolean> => {
    const [result] = await db
        .select({ id: musicGroupMembersTable.id })
        .from(musicGroupMembersTable)
        .where(and(eq(musicGroupMembersTable.musicGroupId, bandId), eq(musicGroupMembersTable.userId, userId)))
        .limit(1);

    return Boolean(result);
};

export const getAdminCount = async (bandId: number): Promise<number> => {
    const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(musicGroupMembersTable)
        .where(and(eq(musicGroupMembersTable.musicGroupId, bandId), eq(musicGroupMembersTable.isAdmin, true)));

    return result?.count ?? 0;
};

export const getUserBands = async (userId: string): Promise<BandMembership[]> => {
    const results = await db
        .select({
            id: musicGroupsTable.id,
            name: musicGroupsTable.name,
            primaryGenre: musicGroupsTable.primaryGenre,
            city: musicGroupsTable.city,
            state: musicGroupsTable.state,
            profileImageUrl: musicGroupsTable.profileImageUrl,
            isAdmin: musicGroupMembersTable.isAdmin,
            joinedAt: musicGroupMembersTable.joinedAt
        })
        .from(musicGroupMembersTable)
        .innerJoin(musicGroupsTable, eq(musicGroupMembersTable.musicGroupId, musicGroupsTable.id))
        .where(eq(musicGroupMembersTable.userId, userId))
        .orderBy(desc(musicGroupMembersTable.isAdmin), desc(musicGroupMembersTable.joinedAt));

    return results.map((r) => ({
        id: r.id,
        name: r.name,
        primaryGenre: r.primaryGenre,
        city: r.city,
        state: r.state,
        profileImageUrl: r.profileImageUrl,
        isAdmin: Boolean(r.isAdmin),
        joinedAt: r.joinedAt
    }));
};

export const userExists = async (userId: string): Promise<boolean> => {
    const [result] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);

    return Boolean(result);
};
