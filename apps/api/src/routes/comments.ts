import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import { createCommentSchema } from '@/common/types/models';
import { getCommentsByPostId, createComment, likeComment, unlikeComment, getCommentLikesData } from '@/api/db/queries/comments-queries';
import { getPostById } from '@/api/db/queries/posts-queries';
import { isBandAdmin } from '@/api/db/queries/bands-queries';
import { notificationQueueMessageSchema } from '@sound-connect/common/types/notifications';

const commentsRoutes = new Hono<HonoContext>();

commentsRoutes.get('/posts/:postId/comments', async (c) => {
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    const comments = await getCommentsByPostId(postId);
    return c.json(comments);
});

commentsRoutes.post('/comments', async (c) => {
    const user = c.get('user');

    const body = await c.req.json();
    const { postId, parentCommentId, content } = createCommentSchema.parse(body);

    const post = await getPostById(postId);

    if (!post) {
        return c.json({ error: 'Post not found' }, 404);
    }

    let authorType: 'user' | 'band' = 'user';
    let bandId: number | null = null;

    if (post.post.authorType === 'band' && post.post.bandId) {
        const isAdmin = await isBandAdmin(post.post.bandId, user.id);
        if (isAdmin) {
            authorType = 'band';
            bandId = post.post.bandId;
        }
    }

    const comment = await createComment(user.id, postId, content, parentCommentId, authorType, bandId);

    if (post.post.userId !== user.id) {
        const postPreview = post.post.content.length > 100 ? post.post.content.substring(0, 100) : post.post.content;

        const queueMessage = notificationQueueMessageSchema.parse({
            userId: post.post.userId,
            type: 'comment',
            actorId: user.id,
            actorName: user.name,
            entityId: String(postId),
            entityType: 'post',
            content: postPreview
        });

        await c.env.NotificationsQueue.send(queueMessage);
    }

    return c.json(comment);
});

commentsRoutes.post('/comments/:commentId/like', async (c) => {
    const user = c.get('user');
    const { commentId } = z.object({ commentId: z.coerce.number().positive() }).parse(c.req.param());

    await likeComment(user.id, commentId);
    const likesData = await getCommentLikesData(user.id, commentId);

    return c.json({ success: true, ...likesData });
});

commentsRoutes.delete('/comments/:commentId/like', async (c) => {
    const user = c.get('user');
    const { commentId } = z.object({ commentId: z.coerce.number().positive() }).parse(c.req.param());

    await unlikeComment(user.id, commentId);
    const likesData = await getCommentLikesData(user.id, commentId);

    return c.json({ success: true, ...likesData });
});

export { commentsRoutes };
