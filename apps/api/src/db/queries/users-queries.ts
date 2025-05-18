import { usersFollowersTable } from '@/api//db/schema';
import { db } from '@/api/db';
import { eq } from 'drizzle-orm';

export const getFollowers = async (userId: string) => {
    return db.select({ followerId: usersFollowersTable.followerId }).from(usersFollowersTable).where(eq(usersFollowersTable.userId, userId));
};

export const getFollowings = async (userId: string) => {
    return db.select({ userId: usersFollowersTable.userId }).from(usersFollowersTable).where(eq(usersFollowersTable.followerId, userId));
};
