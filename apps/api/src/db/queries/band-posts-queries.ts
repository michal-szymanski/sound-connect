import { schema } from '@/drizzle';
import { eq, desc, and, count as drizzleCount, inArray } from 'drizzle-orm';
import type { CreateBandPostInput } from '@sound-connect/common/types/band-posts';
import { db } from '../index';

const { postsTable, bandsTable, mediaTable, postsReactionsTable, commentsTable } = schema;

export const createBandPost = async (bandId: number, userId: string, data: CreateBandPostInput) => {
    const now = new Date().toISOString();

    const [post] = await db
        .insert(postsTable)
        .values({
            authorType: 'band',
            bandId,
            userId,
            content: data.content,
            status: 'pending',
            createdAt: now,
            updatedAt: null
        })
        .returning();

    if (!post) {
        throw new Error('Failed to create band post');
    }

    if (data.media && data.media.length > 0) {
        await db.insert(mediaTable).values(
            data.media.map((m) => ({
                postId: post.id,
                type: m.type,
                key: m.key
            }))
        );
    }

    const [band] = await db.select().from(bandsTable).where(eq(bandsTable.id, bandId)).limit(1);

    if (!band) {
        throw new Error('Band not found');
    }

    const media = data.media ? await db.select().from(mediaTable).where(eq(mediaTable.postId, post.id)) : [];

    return {
        ...post,
        band: {
            id: band.id,
            name: band.name,
            username: band.username,
            profileImageUrl: band.profileImageUrl
        },
        media
    };
};

export const getBandPosts = async (bandId: number, page: number = 1, limit: number = 20) => {
    const offset = (page - 1) * limit;

    const posts = await db
        .select({
            id: postsTable.id,
            authorType: postsTable.authorType,
            bandId: postsTable.bandId,
            userId: postsTable.userId,
            content: postsTable.content,
            status: postsTable.status,
            createdAt: postsTable.createdAt,
            updatedAt: postsTable.updatedAt,
            bandName: bandsTable.name,
            bandUsername: bandsTable.username,
            bandProfileImageUrl: bandsTable.profileImageUrl
        })
        .from(postsTable)
        .innerJoin(bandsTable, eq(postsTable.bandId, bandsTable.id))
        .where(and(eq(postsTable.authorType, 'band'), eq(postsTable.bandId, bandId), eq(postsTable.status, 'approved')))
        .orderBy(desc(postsTable.createdAt))
        .limit(limit)
        .offset(offset);

    const [totalResult] = await db
        .select({ count: drizzleCount() })
        .from(postsTable)
        .where(and(eq(postsTable.authorType, 'band'), eq(postsTable.bandId, bandId), eq(postsTable.status, 'approved')));

    const total = totalResult?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    if (posts.length === 0) {
        return {
            posts: [],
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasMore: false
            }
        };
    }

    const postIds = posts.map((p) => p.id);

    const mediaRecords = await db.select().from(mediaTable).where(inArray(mediaTable.postId, postIds));

    const reactions = await db
        .select({
            id: postsReactionsTable.id,
            userId: postsReactionsTable.userId,
            postId: postsReactionsTable.postId,
            createdAt: postsReactionsTable.createdAt
        })
        .from(postsReactionsTable)
        .where(inArray(postsReactionsTable.postId, postIds));

    const commentsCounts = await db
        .select({
            postId: commentsTable.postId,
            count: drizzleCount()
        })
        .from(commentsTable)
        .where(inArray(commentsTable.postId, postIds))
        .groupBy(commentsTable.postId);

    const postsWithMetadata = posts.map((post) => ({
        post: {
            id: post.id,
            authorType: post.authorType,
            bandId: post.bandId,
            userId: post.userId,
            content: post.content,
            status: post.status,
            moderationReason: null,
            moderatedAt: null,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt
        },
        user: null,
        band: {
            id: post.bandId!,
            name: post.bandName!,
            username: post.bandUsername!,
            profileImageUrl: post.bandProfileImageUrl
        },
        reactions: reactions.filter((r) => r.postId === post.id),
        media: mediaRecords.filter((m) => m.postId === post.id),
        commentsCount: commentsCounts.find((c) => c.postId === post.id)?.count ?? 0
    }));

    return {
        posts: postsWithMetadata,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages
        }
    };
};
