import { schema } from '@/drizzle';
import { feedItemSchema, userDTOSchema } from '@/common/types/models';
import { postReactionSchema, postSchema } from '@/common/types/drizzle';
import { desc, eq, inArray, and, count, sql } from 'drizzle-orm';
import z from 'zod';
import { db } from '../index';

const { mediaTable, postsReactionsTable, postsTable, users, commentsTable, bandsTable, bandsFollowersTable, usersFollowersTable } = schema;

type FeedPostRow = {
    id: number;
    authorType: 'user' | 'band';
    userId: string;
    bandId: number | null;
    content: string;
    status: string;
    createdAt: string;
    updatedAt: string | null;
    userName: string | null;
    userImage: string | null;
    bandName: string | null;
    bandProfileImageUrl: string | null;
};

export const getPostsByUserId = async (userId: string) => {
    const results = await db
        .select({
            id: postsTable.id,
            authorType: postsTable.authorType,
            userId: postsTable.userId,
            bandId: postsTable.bandId,
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
                authorType: postsTable.authorType,
                userId: postsTable.userId,
                bandId: postsTable.bandId,
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
            },
            band: {
                id: bandsTable.id,
                name: bandsTable.name,
                profileImageUrl: bandsTable.profileImageUrl
            }
        })
        .from(postsTable)
        .leftJoin(users, eq(postsTable.userId, users.id))
        .leftJoin(bandsTable, eq(postsTable.bandId, bandsTable.id))
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

    const [commentsCountResult] = await db.select({ count: count() }).from(commentsTable).where(eq(commentsTable.postId, postId));

    const postWithReactions = {
        ...post,
        reactions,
        media,
        commentsCount: commentsCountResult?.count ?? 0
    };

    return feedItemSchema.parse(postWithReactions);
};

export const getFeed = async (limit: number = 10, offset: number = 0, currentUserId?: string) => {
    let posts: FeedPostRow[] = [];

    if (currentUserId) {
        const followedUsers = await db
            .select({ userId: usersFollowersTable.followedUserId })
            .from(usersFollowersTable)
            .where(eq(usersFollowersTable.userId, currentUserId));

        const followedBands = await db
            .select({ bandId: bandsFollowersTable.bandId })
            .from(bandsFollowersTable)
            .where(eq(bandsFollowersTable.followerId, currentUserId));

        const followedUserIds = [...followedUsers.map((f) => f.userId), currentUserId];
        const followedBandIds = followedBands.map((f) => f.bandId);

        const userPosts =
            followedUserIds.length > 0
                ? await db
                      .select({
                          id: postsTable.id,
                          authorType: postsTable.authorType,
                          userId: postsTable.userId,
                          bandId: postsTable.bandId,
                          content: postsTable.content,
                          status: postsTable.status,
                          createdAt: postsTable.createdAt,
                          updatedAt: postsTable.updatedAt,
                          userName: users.name,
                          userImage: users.image,
                          bandName: sql<string | null>`NULL`,
                          bandProfileImageUrl: sql<string | null>`NULL`
                      })
                      .from(postsTable)
                      .innerJoin(users, eq(postsTable.userId, users.id))
                      .where(and(eq(postsTable.authorType, 'user'), eq(postsTable.status, 'approved'), inArray(postsTable.userId, followedUserIds)))
                : [];

        const bandPosts =
            followedBandIds.length > 0
                ? await db
                      .select({
                          id: postsTable.id,
                          authorType: postsTable.authorType,
                          userId: postsTable.userId,
                          bandId: postsTable.bandId,
                          content: postsTable.content,
                          status: postsTable.status,
                          createdAt: postsTable.createdAt,
                          updatedAt: postsTable.updatedAt,
                          userName: sql<string | null>`NULL`,
                          userImage: sql<string | null>`NULL`,
                          bandName: bandsTable.name,
                          bandProfileImageUrl: bandsTable.profileImageUrl
                      })
                      .from(postsTable)
                      .innerJoin(bandsTable, eq(postsTable.bandId, bandsTable.id))
                      .where(and(eq(postsTable.authorType, 'band'), eq(postsTable.status, 'approved'), sql`${postsTable.bandId} IN ${followedBandIds}`))
                : [];

        posts = [...userPosts, ...bandPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(offset, offset + limit);
    } else {
        posts = await db
            .select({
                id: postsTable.id,
                authorType: postsTable.authorType,
                userId: postsTable.userId,
                bandId: postsTable.bandId,
                content: postsTable.content,
                status: postsTable.status,
                createdAt: postsTable.createdAt,
                updatedAt: postsTable.updatedAt,
                userName: users.name,
                userImage: users.image,
                bandName: sql<string | null>`NULL`,
                bandProfileImageUrl: sql<string | null>`NULL`
            })
            .from(postsTable)
            .innerJoin(users, eq(postsTable.userId, users.id))
            .where(and(eq(postsTable.authorType, 'user'), eq(postsTable.status, 'approved')))
            .orderBy(desc(postsTable.createdAt))
            .limit(limit)
            .offset(offset);
    }

    if (posts.length === 0) {
        return [];
    }

    const postIds = posts.map((post) => post.id);

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

    const commentsCounts = await db
        .select({
            postId: commentsTable.postId,
            count: count()
        })
        .from(commentsTable)
        .where(inArray(commentsTable.postId, postIds))
        .groupBy(commentsTable.postId);

    const postsWithReactions = posts.map((post) => {
        const baseData = {
            post: {
                id: post.id,
                authorType: post.authorType,
                userId: post.userId,
                bandId: post.bandId,
                content: post.content,
                status: post.status,
                moderationReason: null,
                moderatedAt: null,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt
            },
            reactions: reactions.filter((reaction) => reaction.postId === post.id),
            media: media.filter((m) => m.postId === post.id),
            commentsCount: commentsCounts.find((c) => c.postId === post.id)?.count ?? 0,
            user:
                post.authorType === 'user'
                    ? {
                          id: post.userId,
                          name: post.userName!,
                          image: post.userImage
                      }
                    : null,
            band:
                post.authorType === 'band'
                    ? {
                          id: post.bandId!,
                          name: post.bandName!,
                          profileImageUrl: post.bandProfileImageUrl
                      }
                    : null
        };

        return baseData;
    });

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
            authorType: 'user',
            userId,
            bandId: null,
            content,
            status: 'pending',
            createdAt: new Date().toISOString()
        })
        .returning();

    const [post] = z.array(postSchema).parse(results);
    return post;
};

export const likePost = async (userId: string, postId: number) => {
    const existing = await db
        .select()
        .from(postsReactionsTable)
        .where(and(eq(postsReactionsTable.userId, userId), eq(postsReactionsTable.postId, postId)))
        .limit(1);

    if (existing.length > 0) {
        return;
    }

    await db.insert(postsReactionsTable).values({
        userId,
        postId,
        createdAt: new Date().toISOString()
    });
};

export const unlikePost = async (userId: string, postId: number) => {
    await db.delete(postsReactionsTable).where(and(eq(postsReactionsTable.userId, userId), eq(postsReactionsTable.postId, postId)));
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
