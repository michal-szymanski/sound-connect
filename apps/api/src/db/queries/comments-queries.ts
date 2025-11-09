import { count, desc, eq, isNull, and, inArray } from 'drizzle-orm';
import { schema } from '@/drizzle';
import { db } from '../index';

const { commentsTable, commentsReactionsTable, users, bandsTable } = schema;

export async function getCommentsByPostId(postId: number) {
    const comments = await db
        .select({
            comment: {
                id: commentsTable.id,
                authorType: commentsTable.authorType,
                userId: commentsTable.userId,
                bandId: commentsTable.bandId,
                postId: commentsTable.postId,
                parentCommentId: commentsTable.parentCommentId,
                content: commentsTable.content,
                createdAt: commentsTable.createdAt,
                updatedAt: commentsTable.updatedAt
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
        .from(commentsTable)
        .leftJoin(users, eq(commentsTable.userId, users.id))
        .leftJoin(bandsTable, eq(commentsTable.bandId, bandsTable.id))
        .where(and(eq(commentsTable.postId, postId), isNull(commentsTable.parentCommentId)))
        .orderBy(desc(commentsTable.createdAt));

    const commentIds = comments.map((c) => c.comment.id);

    if (commentIds.length === 0) {
        return [];
    }

    const reactions = await db
        .select({
            id: commentsReactionsTable.id,
            commentId: commentsReactionsTable.commentId,
            userId: commentsReactionsTable.userId,
            createdAt: commentsReactionsTable.createdAt
        })
        .from(commentsReactionsTable)
        .where(inArray(commentsReactionsTable.commentId, commentIds));

    const replies = await db
        .select({
            comment: {
                id: commentsTable.id,
                authorType: commentsTable.authorType,
                userId: commentsTable.userId,
                bandId: commentsTable.bandId,
                postId: commentsTable.postId,
                parentCommentId: commentsTable.parentCommentId,
                content: commentsTable.content,
                createdAt: commentsTable.createdAt,
                updatedAt: commentsTable.updatedAt
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
        .from(commentsTable)
        .leftJoin(users, eq(commentsTable.userId, users.id))
        .leftJoin(bandsTable, eq(commentsTable.bandId, bandsTable.id))
        .where(inArray(commentsTable.parentCommentId, commentIds))
        .orderBy(desc(commentsTable.createdAt));

    const replyIds = replies.map((r) => r.comment.id);

    const replyReactions = replyIds.length
        ? await db
              .select({
                  id: commentsReactionsTable.id,
                  commentId: commentsReactionsTable.commentId,
                  userId: commentsReactionsTable.userId,
                  createdAt: commentsReactionsTable.createdAt
              })
              .from(commentsReactionsTable)
              .where(inArray(commentsReactionsTable.commentId, replyIds))
        : [];

    return comments.map((comment) => {
        const commentReactions = reactions.filter((r) => r.commentId === comment.comment.id);

        const commentReplies = replies
            .filter((r) => r.comment.parentCommentId === comment.comment.id)
            .map((reply) => {
                const replyReactionsList = replyReactions.filter((r) => r.commentId === reply.comment.id);
                return {
                    comment: reply.comment,
                    user: reply.user,
                    band: reply.band,
                    reactions: replyReactionsList
                };
            });

        return {
            comment: comment.comment,
            user: comment.user,
            band: comment.band,
            reactions: commentReactions,
            replies: commentReplies
        };
    });
}

export async function createComment(
    userId: string,
    postId: number,
    content: string,
    parentCommentId?: number | null,
    authorType: 'user' | 'band' = 'user',
    bandId?: number | null
) {
    if (parentCommentId) {
        const parentComment = await db
            .select({ parentCommentId: commentsTable.parentCommentId })
            .from(commentsTable)
            .where(eq(commentsTable.id, parentCommentId))
            .limit(1);

        const parent = parentComment[0];

        if (!parent) {
            throw new Error('Parent comment not found');
        }

        if (parent.parentCommentId !== null) {
            throw new Error('Cannot reply to a reply');
        }
    }

    const result = await db
        .insert(commentsTable)
        .values({
            authorType,
            userId,
            bandId: bandId || null,
            postId,
            parentCommentId: parentCommentId || null,
            content,
            createdAt: new Date().toISOString(),
            updatedAt: null
        })
        .returning();

    if (Array.isArray(result) && result.length > 0) {
        return result[0];
    }
    throw new Error('Failed to create comment');
}

export async function likeComment(userId: string, commentId: number) {
    await db.insert(commentsReactionsTable).values({
        userId,
        commentId,
        createdAt: new Date().toISOString()
    });
}

export async function unlikeComment(userId: string, commentId: number) {
    await db.delete(commentsReactionsTable).where(and(eq(commentsReactionsTable.userId, userId), eq(commentsReactionsTable.commentId, commentId)));
}

export async function getCommentLikesData(userId: string, commentId: number) {
    const [likesCountResult] = await db.select({ count: count() }).from(commentsReactionsTable).where(eq(commentsReactionsTable.commentId, commentId));

    const userLike = await db
        .select()
        .from(commentsReactionsTable)
        .where(and(eq(commentsReactionsTable.commentId, commentId), eq(commentsReactionsTable.userId, userId)));

    return {
        likesCount: likesCountResult?.count ?? 0,
        isLiked: userLike.length > 0
    };
}
