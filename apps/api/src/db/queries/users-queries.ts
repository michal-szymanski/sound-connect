import { users, usersFollowersTable } from '@/api//db/schema';
import { db } from '@/api/db';
import { eq } from 'drizzle-orm';
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
