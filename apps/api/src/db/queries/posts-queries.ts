import { mediaTable, postsReactionsTable, postsTable, users } from '@/api/db/schema';
import { feedItemSchema, postReactionSchema, postSchema, userDTOSchema } from '@sound-connect/common/types/models';
import { desc, eq, inArray, and, count } from 'drizzle-orm';
import z from 'zod';
import { db } from '@/api/db';

export const getPostsByUserId = async (userId: string) => {
    const results = await db
        .select({
            id: postsTable.id,
            userId: postsTable.userId,
            content: postsTable.content,
            status: postsTable.status,
            moderationReason: postsTable.moderationReason,
            moderatedAt: postsTable.moderatedAt,
            createdAt: postsTable.createdAt,
            updatedAt: postsTable.updatedAt
        })
        .from(postsTable)
        .where(eq(postsTable.userId, userId));

    const schema = z.array(postSchema);
    return schema.parse(results);
};

export const getPostById = async (postId: number) => {
    const posts = await db
        .select({
            post: {
                id: postsTable.id,
                userId: postsTable.userId,
                content: postsTable.content,
                status: postsTable.status,
                moderationReason: postsTable.moderationReason,
                moderatedAt: postsTable.moderatedAt,
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
        .where(and(eq(postsTable.id, postId), eq(postsTable.status, 'approved')))
        .limit(1);

    if (posts.length === 0) {
        return null;
    }

    const [post] = posts;

    const reactions = await db
        .select({
            id: postsReactionsTable.id,
            userId: postsReactionsTable.userId,
            postId: postsReactionsTable.postId,
            createdAt: postsReactionsTable.createdAt
        })
        .from(postsReactionsTable)
        .where(eq(postsReactionsTable.postId, postId));

    const media = await db.select().from(mediaTable).where(eq(mediaTable.postId, postId));

    const postWithReactions = {
        ...post,
        reactions,
        media
    };

    return feedItemSchema.parse(postWithReactions);
};

export const getFeed = async (limit: number = 10, offset: number = 0) => {
    const posts = await db
        .select({
            post: {
                id: postsTable.id,
                userId: postsTable.userId,
                content: postsTable.content,
                status: postsTable.status,
                moderationReason: postsTable.moderationReason,
                moderatedAt: postsTable.moderatedAt,
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
        .where(eq(postsTable.status, 'approved'))
        .orderBy(desc(postsTable.createdAt))
        .limit(limit)
        .offset(offset);

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

    const media = await db.select().from(mediaTable).where(inArray(mediaTable.postId, postIds));

    const postsWithReactions = posts.map((post) => ({
        ...post,
        reactions: reactions.filter((reaction) => reaction.postId === post.post.id),
        media: media.filter((m) => m.postId === post.post.id)
    }));

    const schema = z.array(feedItemSchema);

    return schema.parse(postsWithReactions);
};

export const getReactions = async (postId: number) => {
    const results = await db
        .select({
            id: postsReactionsTable.id,
            userId: postsReactionsTable.userId,
            postId: postsReactionsTable.postId,
            createdAt: postsReactionsTable.createdAt
        })
        .from(postsReactionsTable)
        .where(eq(postsReactionsTable.postId, postId));

    const schema = z.array(postReactionSchema);
    return schema.parse(results);
};

export const addPost = async (userId: string, content: string) => {
    const results = await db
        .insert(postsTable)
        .values({
            userId,
            content,
            status: 'pending',
            createdAt: new Date().toISOString()
        })
        .returning();

    const [post] = z.array(postSchema).parse(results);
    return post;
};

export const likePost = async (userId: string, postId: number) => {
    db.insert(postsReactionsTable).values({
        userId,
        postId,
        createdAt: new Date().toISOString()
    });
};

export const unlikePost = async (userId: string, postId: number) => {
    db.delete(postsReactionsTable).where(and(eq(postsReactionsTable.userId, userId), eq(postsReactionsTable.postId, postId)));
};

export const getPostLikeStatus = async (userId: string, postId: number) => {
    const result = await db
        .select()
        .from(postsReactionsTable)
        .where(and(eq(postsReactionsTable.userId, userId), eq(postsReactionsTable.postId, postId)))
        .limit(1);

    return result.length > 0;
};

export const getPostLikesCount = async (postId: number) => {
    const result = await db.select({ count: count() }).from(postsReactionsTable).where(eq(postsReactionsTable.postId, postId));

    return result[0]?.count ?? 0;
};

export const getPostLikesData = async (userId: string, postId: number) => {
    const [likesCount, isLiked] = await Promise.all([getPostLikesCount(postId), getPostLikeStatus(userId, postId)]);

    return { likesCount, isLiked };
};

export const getPostLikesUsers = async (postId: number) => {
    const results = await db
        .select({
            id: users.id,
            name: users.name,
            image: users.image
        })
        .from(postsReactionsTable)
        .innerJoin(users, eq(postsReactionsTable.userId, users.id))
        .where(eq(postsReactionsTable.postId, postId))
        .orderBy(desc(postsReactionsTable.createdAt));

    const schema = z.array(userDTOSchema);
    return schema.parse(results);
};
