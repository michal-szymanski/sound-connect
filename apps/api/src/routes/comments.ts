import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import { createCommentSchema } from '@/common/types/models';
import { getCommentsByPostId, createComment, likeComment, unlikeComment, getCommentLikesData } from '@/api/db/queries/comments-queries';

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

    const comment = await createComment(user.id, postId, content, parentCommentId);

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
