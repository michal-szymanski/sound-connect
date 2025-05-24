import { users, usersFollowersTable } from '@/api//db/schema';
import { db } from '@/api/db';
import { aliasedTable, eq } from 'drizzle-orm';
import { and } from 'drizzle-orm';

export const getFollowedUsers = async (userId: string) => {
    return db.select({ followedUserId: usersFollowersTable.followedUserId }).from(usersFollowersTable).where(eq(usersFollowersTable.userId, userId));
};

export const getUserFollowers = async (userId: string) => {
    return db.select({ userId: usersFollowersTable.userId }).from(usersFollowersTable).where(eq(usersFollowersTable.followedUserId, userId));
};

export const getUserById = async (userId: string) => {
    return db.select({ id: users.id, name: users.name, image: users.image }).from(users).where(eq(users.id, userId));
};

export const followUser = async (userId: string, followedUserId: string) => {
    return db.insert(usersFollowersTable).values({ userId, followedUserId, createdAt: new Date().toISOString() });
};

export const unfollowUser = async (userId: string, followedUserId: string) => {
    return db.delete(usersFollowersTable).where(and(eq(usersFollowersTable.userId, userId), eq(usersFollowersTable.followedUserId, followedUserId)));
};

export const getMutualFollowers = (userId: string) => {
    const uf2 = aliasedTable(usersFollowersTable, 'uf2');

    return db
        .select({
            id: users.id,
            name: users.name,
            image: users.image
        })
        .from(usersFollowersTable)
        .innerJoin(uf2, and(eq(usersFollowersTable.followedUserId, uf2.userId), eq(usersFollowersTable.userId, uf2.followedUserId)))
        .innerJoin(users, eq(users.id, usersFollowersTable.followedUserId))
        .where(eq(usersFollowersTable.userId, userId));
};
