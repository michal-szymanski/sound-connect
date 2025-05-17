import { usersFollowersTable } from '@/api//db/schema';
import { eq } from 'drizzle-orm';
import { DrizzleDB } from 'types';

export const getFollowers = async (db: DrizzleDB, userId: string) => {
    return db.select({ followerId: usersFollowersTable.followerId }).from(usersFollowersTable).where(eq(usersFollowersTable.userId, userId));
};

export const getFollowings = async (db: DrizzleDB, userId: string) => {
    return db.select({ userId: usersFollowersTable.userId }).from(usersFollowersTable).where(eq(usersFollowersTable.followerId, userId));
};
