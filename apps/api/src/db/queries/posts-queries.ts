import { postsReactionsTable, postsTable, users } from '@/api/db/schema';
import { feedItemSchema, postReactionSchema, postSchema, userDTOSchema } from '@sound-connect/common/types/models';
import { desc, eq, inArray, sql, and, count } from 'drizzle-orm';
import z from 'zod';
import { db } from '@/api/db';

const getPostsByUserIdQuery = db
    .select({
        id: postsTable.id,
        userId: postsTable.userId,
        content: postsTable.content,
        createdAt: postsTable.createdAt,
        updatedAt: postsTable.updatedAt
    })
    .from(postsTable)
    .where(eq(postsTable.userId, sql.placeholder('userId')))
    .prepare();

export const getPostsByUserId = async (userId: string) => {
    const results = await getPostsByUserIdQuery.execute({ userId });
    const schema = z.array(postSchema);
    return schema.parse(results);
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

    if (posts.length === 0) {
        return [];
    }

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

    const schema = z.array(feedItemSchema);

    return schema.parse(postsWithReactions);
};

const getReactionsQuery = db
    .select({
        id: postsReactionsTable.id,
        userId: postsReactionsTable.userId,
        postId: postsReactionsTable.postId,
        createdAt: postsReactionsTable.createdAt
    })
    .from(postsReactionsTable)
    .where(eq(postsReactionsTable.postId, sql.placeholder('postId')))
    .prepare();

export const getReactions = async (postId: number) => {
    const results = await getReactionsQuery.execute({ postId });
    const schema = z.array(postReactionSchema);
    return schema.parse(results);
};

const addPostQuery = db
    .insert(postsTable)
    .values({
        userId: sql.placeholder('userId'),
        content: sql.placeholder('content'),
        createdAt: sql.placeholder('createdAt')
    })
    .prepare();

export const addPost = async (userId: string, content: string) => {
    return addPostQuery.execute({
        userId,
        content,
        createdAt: new Date().toISOString()
    });
};

const likePostQuery = db
    .insert(postsReactionsTable)
    .values({
        userId: sql.placeholder('userId'),
        postId: sql.placeholder('postId'),
        createdAt: sql.placeholder('createdAt')
    })
    .prepare();

export const likePost = async (userId: string, postId: number) => {
    return likePostQuery.execute({
        userId,
        postId,
        createdAt: new Date().toISOString()
    });
};

const unlikePostQuery = db
    .delete(postsReactionsTable)
    .where(and(eq(postsReactionsTable.userId, sql.placeholder('userId')), eq(postsReactionsTable.postId, sql.placeholder('postId'))))
    .prepare();

export const unlikePost = async (userId: string, postId: number) => {
    return unlikePostQuery.execute({ userId, postId });
};

const getPostLikeStatusQuery = db
    .select()
    .from(postsReactionsTable)
    .where(and(eq(postsReactionsTable.userId, sql.placeholder('userId')), eq(postsReactionsTable.postId, sql.placeholder('postId'))))
    .limit(1)
    .prepare();

export const getPostLikeStatus = async (userId: string, postId: number) => {
    const result = await getPostLikeStatusQuery.execute({ userId, postId });
    return result.length > 0;
};

const getPostLikesCountQuery = db
    .select({ count: count() })
    .from(postsReactionsTable)
    .where(eq(postsReactionsTable.postId, sql.placeholder('postId')))
    .prepare();

export const getPostLikesCount = async (postId: number) => {
    const result = await getPostLikesCountQuery.execute({ postId });
    return result[0]?.count ?? 0;
};

export const getPostLikesData = async (userId: string, postId: number) => {
    const [likesCount, isLiked] = await Promise.all([getPostLikesCount(postId), getPostLikeStatus(userId, postId)]);

    return { likesCount, isLiked };
};

const getPostLikesUsersQuery = db
    .select({
        id: users.id,
        name: users.name,
        image: users.image
    })
    .from(postsReactionsTable)
    .innerJoin(users, eq(postsReactionsTable.userId, users.id))
    .where(eq(postsReactionsTable.postId, sql.placeholder('postId')))
    .orderBy(desc(postsReactionsTable.createdAt))
    .prepare();

export const getPostLikesUsers = async (postId: number) => {
    const results = await getPostLikesUsersQuery.execute({ postId });
    const schema = z.array(userDTOSchema);
    return schema.parse(results);
};
