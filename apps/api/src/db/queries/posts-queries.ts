import { db } from '@/api/db';
import { postsReactionsTable, postsTable } from '@/api/db/schema';
import { eq } from 'drizzle-orm';

export const getPostsByUserId = async (userId: string) => {
    return db.select({ id: postsTable.id, userId: postsTable.userId, content: postsTable.content }).from(postsTable).where(eq(postsTable.userId, userId));
};

export const getFeed = async () => {
    return db.select({ id: postsTable.id, userId: postsTable.userId, content: postsTable.content, createdAt: postsTable.createdAt }).from(postsTable);
};

export const getReactions = async (postId: number) => {
    return db
        .select({ id: postsReactionsTable.id, userId: postsReactionsTable.userId })
        .from(postsReactionsTable)
        .where(eq(postsReactionsTable.postId, postId));
};
