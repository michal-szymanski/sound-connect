import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import {
    addPost,
    getFeed,
    getPostsByUserId,
    getReactions,
    likePost,
    unlikePost,
    getPostLikesData,
    getPostLikesUsers,
    getPostById
} from '@/api/db/queries/posts-queries';
import { addMedia } from '@/api/db/queries/media-queries';

const postsRoutes = new Hono<HonoContext>();

postsRoutes.get('/posts/:postId', async (c) => {
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    const postResult = await getPostById(postId);

    if (!postResult) {
        throw new HTTPException(404, { message: 'Post not found' });
    }

    return c.json(postResult);
});

postsRoutes.get('/users/:userId/posts', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const postsResults = await getPostsByUserId(userId);
    return c.json(postsResults);
});

postsRoutes.post('/posts', async (c) => {
    const form = await c.req.formData();

    const { content, media } = z
        .object({
            content: z.string(),
            media: z.array(z.instanceof(File)).optional()
        })
        .parse({
            content: form.get('content'),
            media: form.getAll('media')
        });

    const user = c.get('user');
    const postResults = await addPost(user.id, content);

    if (!postResults) {
        throw new HTTPException(500, { message: 'Failed to add post' });
    }

    if (!media || !media.length) {
        await c.env.PostsQueue.send({
            postId: postResults.id,
            userId: user.id,
            content,
            mediaKeys: []
        });

        return c.json({ post: postResults, media: [] });
    }

    const mediaKeys = [];

    for (const file of media) {
        const key = crypto.randomUUID();
        const uploadedFile = await c.env.UsersBucket.put(key, file);

        if (uploadedFile) {
            mediaKeys.push(uploadedFile.key);
        }
    }

    const mediaResults = await addMedia(postResults.id, mediaKeys);

    await c.env.PostsQueue.send({
        postId: postResults.id,
        userId: user.id,
        content,
        mediaKeys
    });

    return c.json({ post: postResults, media: mediaResults });
});

postsRoutes.get('/feed', async (c) => {
    const { limit, offset } = z
        .object({
            limit: z.coerce.number().positive().max(50).optional().default(10),
            offset: z.coerce.number().min(0).optional().default(0)
        })
        .parse({
            limit: c.req.query('limit'),
            offset: c.req.query('offset')
        });

    const feedResults = await getFeed(limit, offset);

    return c.json(feedResults, 200);
});

postsRoutes.get('/posts/:postId/reactions', async (c) => {
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    const reactionsResults = await getReactions(postId);
    return c.json(reactionsResults);
});

postsRoutes.post('/posts/:postId/like', async (c) => {
    const user = c.get('user');
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    await likePost(user.id, postId);
    const likesData = await getPostLikesData(user.id, postId);

    return c.json({ success: true, ...likesData });
});

postsRoutes.delete('/posts/:postId/like', async (c) => {
    const user = c.get('user');
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    await unlikePost(user.id, postId);
    const likesData = await getPostLikesData(user.id, postId);

    return c.json({ success: true, ...likesData });
});

postsRoutes.get('/posts/:postId/likes', async (c) => {
    const user = c.get('user');
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    const likesData = await getPostLikesData(user.id, postId);
    return c.json(likesData);
});

postsRoutes.get('/posts/:postId/likes/users', async (c) => {
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    const likesUsers = await getPostLikesUsers(postId);
    return c.json(likesUsers);
});

export { postsRoutes };
