import { postsReactionsTable, postsTable } from '@/api/db/schema';
import { eq } from 'drizzle-orm';
import { DrizzleDB } from 'types';

export const getPostsByUserId = async (db: DrizzleDB, userId: string) => {
    return db.select({ id: postsTable.id, userId: postsTable.userId, content: postsTable.content }).from(postsTable).where(eq(postsTable.userId, userId));
};

export const getFeed = async (db: DrizzleDB) => {
    return db.select({ id: postsTable.id, userId: postsTable.userId, content: postsTable.content, createdAt: postsTable.createdAt }).from(postsTable);
};

export const getReactions = async (db: DrizzleDB, postId: number) => {
    return db
        .select({ id: postsReactionsTable.id, userId: postsReactionsTable.userId })
        .from(postsReactionsTable)
        .where(eq(postsReactionsTable.postId, postId));
};
