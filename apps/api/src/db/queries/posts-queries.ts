import { db } from '@/api/db';
import { postsReactionsTable, postsTable, users } from '@/api/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

export const getPostsByUserId = async (userId: string) => {
    return db.select({ id: postsTable.id, userId: postsTable.userId, content: postsTable.content }).from(postsTable).where(eq(postsTable.userId, userId));
};

export const getFeed = async () => {
    const posts = await db
        .select({
            post: {
                id: postsTable.id,
                userId: postsTable.userId,
                content: postsTable.content,
                createdAt: postsTable.createdAt,
                updatedAt: postsTable.updatedAt
            },
            user: {
                id: users.id,
                name: users.name,
                image: users.image
            }
        })
        .from(postsTable)
        .innerJoin(users, eq(postsTable.userId, users.id))
        .orderBy(desc(postsTable.createdAt));

    const postIds = posts.map((post) => post.post.id);

    const reactions = await db
        .select({
            id: postsReactionsTable.id,
            userId: postsReactionsTable.userId,
            postId: postsReactionsTable.postId,
            createdAt: postsReactionsTable.createdAt
        })
        .from(postsReactionsTable)
        .where(inArray(postsReactionsTable.postId, postIds));

    const postsWithReactions = posts.map((post) => ({
        ...post,
        reactions: reactions.filter((reaction) => reaction.postId === post.post.id)
    }));

    return postsWithReactions;
};

export const getReactions = async (postId: number) => {
    return db
        .select({ id: postsReactionsTable.id, userId: postsReactionsTable.userId })
        .from(postsReactionsTable)
        .where(eq(postsReactionsTable.postId, postId));
};

export const addPost = async (userId: string, content: string) => {
    return db.insert(postsTable).values({ userId, content, createdAt: new Date().toISOString() });
};
