import { db } from '@/api/db';
import { postsReactionsTable, postsTable, users } from '@/api/db/schema';
import { feedItemSchema, postReactionSchema, postSchema } from '@sound-connect/common/types/models';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import z from 'zod';

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

const getFeedPostsQuery = db
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
    .orderBy(desc(postsTable.createdAt))
    .prepare();

export const getFeed = async () => {
    const posts = await getFeedPostsQuery.execute();

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

const getPostReactionsQuery = db
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
    const results = await getPostReactionsQuery.execute({ postId });
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
