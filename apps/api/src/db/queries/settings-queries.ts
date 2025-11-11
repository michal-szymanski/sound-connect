import { schema } from '@/drizzle';
import { eq, and } from 'drizzle-orm';
import { db } from '../index';

const { userSettingsTable, blockedUsersTable, users } = schema;

export const getUserSettings = async (userId: string) => {
    const results = await db.select().from(userSettingsTable).where(eq(userSettingsTable.userId, userId)).limit(1);

    return results[0] || null;
};

export const createUserSettings = async (userId: string) => {
    const now = new Date().toISOString();

    const [settings] = await db
        .insert(userSettingsTable)
        .values({
            userId,
            createdAt: now,
            updatedAt: now
        })
        .returning();

    return settings || null;
};

export const updatePrivacySettings = async (
    userId: string,
    data: {
        profileVisibility?: 'public' | 'followers_only' | 'private';
        searchVisibility?: boolean;
        messagingPermission?: 'anyone' | 'followers' | 'none';
        followPermission?: 'anyone' | 'approval' | 'none';
    }
) => {
    const now = new Date().toISOString();

    const [updated] = await db
        .update(userSettingsTable)
        .set({
            ...data,
            updatedAt: now
        })
        .where(eq(userSettingsTable.userId, userId))
        .returning();

    return updated || null;
};

export const updateNotificationSettings = async (
    userId: string,
    data: {
        emailEnabled?: boolean;
        followNotifications?: boolean;
        commentNotifications?: boolean;
        reactionNotifications?: boolean;
        mentionNotifications?: boolean;
        bandApplicationNotifications?: boolean;
        bandResponseNotifications?: boolean;
    }
) => {
    const now = new Date().toISOString();

    const [updated] = await db
        .update(userSettingsTable)
        .set({
            ...data,
            updatedAt: now
        })
        .where(eq(userSettingsTable.userId, userId))
        .returning();

    return updated || null;
};

export const getBlockedUsers = async (blockerId: string) => {
    const results = await db
        .select({
            id: users.id,
            name: users.name,
            image: users.image,
            blockedAt: blockedUsersTable.blockedAt
        })
        .from(blockedUsersTable)
        .innerJoin(users, eq(users.id, blockedUsersTable.blockedId))
        .where(eq(blockedUsersTable.blockerId, blockerId));

    return results;
};

export const blockUser = async (blockerId: string, blockedId: string) => {
    const now = new Date().toISOString();

    await db.insert(blockedUsersTable).values({
        blockerId,
        blockedId,
        blockedAt: now
    });
};

export const unblockUser = async (blockerId: string, blockedId: string) => {
    await db.delete(blockedUsersTable).where(and(eq(blockedUsersTable.blockerId, blockerId), eq(blockedUsersTable.blockedId, blockedId)));
};

export const isUserBlocked = async (blockerId: string, blockedId: string) => {
    const results = await db
        .select()
        .from(blockedUsersTable)
        .where(and(eq(blockedUsersTable.blockerId, blockerId), eq(blockedUsersTable.blockedId, blockedId)))
        .limit(1);

    return results.length > 0;
};

export const isBlockedByUser = async (userId: string, potentialBlockerId: string) => {
    const results = await db
        .select()
        .from(blockedUsersTable)
        .where(and(eq(blockedUsersTable.blockerId, potentialBlockerId), eq(blockedUsersTable.blockedId, userId)))
        .limit(1);

    return results.length > 0;
};

export const checkIfFollowing = async (followerId: string, followeeId: string) => {
    const { usersFollowersTable } = schema;

    const results = await db
        .select()
        .from(usersFollowersTable)
        .where(and(eq(usersFollowersTable.userId, followerId), eq(usersFollowersTable.followedUserId, followeeId)))
        .limit(1);

    return results.length > 0;
};

export const canViewProfile = async (requesterId: string, profileOwnerId: string) => {
    if (requesterId === profileOwnerId) {
        return true;
    }

    if ((await isUserBlocked(requesterId, profileOwnerId)) || (await isUserBlocked(profileOwnerId, requesterId))) {
        return false;
    }

    const settings = await getUserSettings(profileOwnerId);

    if (!settings) {
        return true;
    }

    if (settings.profileVisibility === 'private') {
        return false;
    }

    if (settings.profileVisibility === 'followers_only') {
        return await checkIfFollowing(requesterId, profileOwnerId);
    }

    return true;
};

export const canSendMessage = async (senderId: string, recipientId: string) => {
    if ((await isUserBlocked(senderId, recipientId)) || (await isUserBlocked(recipientId, senderId))) {
        return false;
    }

    const settings = await getUserSettings(recipientId);

    if (!settings) {
        return true;
    }

    if (settings.messagingPermission === 'none') {
        return false;
    }

    if (settings.messagingPermission === 'followers') {
        return await checkIfFollowing(senderId, recipientId);
    }

    return true;
};

export const canFollow = async (followerId: string, followeeId: string) => {
    if ((await isUserBlocked(followerId, followeeId)) || (await isUserBlocked(followeeId, followerId))) {
        return 'blocked' as const;
    }

    const settings = await getUserSettings(followeeId);

    if (!settings) {
        return 'direct' as const;
    }

    if (settings.followPermission === 'none') {
        return 'blocked' as const;
    }

    if (settings.followPermission === 'approval') {
        return 'approval' as const;
    }

    return 'direct' as const;
};
