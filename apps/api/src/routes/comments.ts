import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import { createCommentSchema } from '@/common/types/models';
import { getCommentsByPostId, createComment, likeComment, unlikeComment, getCommentLikesData } from '@/api/db/queries/comments-queries';

const commentsRoutes = new Hono<HonoContext>();

commentsRoutes.get('/posts/:postId/comments', async (c) => {
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    try {
        const comments = await getCommentsByPostId(postId);
        return c.json(comments);
    } catch (error) {
        console.error({ error });
        return c.json({ error: 'Failed to get comments' }, 500);
    }
});

commentsRoutes.post('/comments', async (c) => {
    const user = c.get('user');

    try {
        const body = await c.req.json();
        const { postId, parentCommentId, content } = createCommentSchema.parse(body);

        const comment = await createComment(user.id, postId, content, parentCommentId);

        return c.json(comment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ error: 'Invalid request data', details: error.issues }, 400);
        }
        console.error({ error });
        return c.json({ error: 'Failed to create comment' }, 500);
    }
});

commentsRoutes.post('/comments/:commentId/like', async (c) => {
    const user = c.get('user');
    const { commentId } = z.object({ commentId: z.coerce.number().positive() }).parse(c.req.param());

    try {
        await likeComment(user.id, commentId);
        const likesData = await getCommentLikesData(user.id, commentId);

        return c.json({ success: true, ...likesData });
    } catch (error) {
        console.error({ error });
        return c.json({ error: 'Failed to like comment' }, 500);
    }
});

commentsRoutes.delete('/comments/:commentId/like', async (c) => {
    const user = c.get('user');
    const { commentId } = z.object({ commentId: z.coerce.number().positive() }).parse(c.req.param());

    try {
        await unlikeComment(user.id, commentId);
        const likesData = await getCommentLikesData(user.id, commentId);

        return c.json({ success: true, ...likesData });
    } catch (error) {
        console.error({ error });
        return c.json({ error: 'Failed to unlike comment' }, 500);
    }
});

export { commentsRoutes };
