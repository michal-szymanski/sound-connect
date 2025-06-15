import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import { addPost, getFeed, getPostsByUserId, getReactions, likePost, unlikePost, getPostLikesData, getPostLikesUsers } from '@/api/db/queries/posts-queries';

const postsRoutes = new Hono<HonoContext>();

postsRoutes.get('/posts/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const postsResults = await getPostsByUserId(userId);

    return c.json(postsResults);
});

postsRoutes.post('/posts', async (c) => {
    const body = await c.req.json();
    const { content } = z.object({ content: z.string() }).parse(body);
    const user = c.get('user');
    await addPost(user.id, content);

    return c.json('ok');
});

postsRoutes.get('/feed', async (c) => {
    const feedResults = await getFeed();

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

    try {
        await likePost(user.id, postId);
        const likesData = await getPostLikesData(user.id, postId);

        return c.json({ success: true, ...likesData });
    } catch (error) {
        return c.json({ error: 'Failed to like post' }, 500);
    }
});

postsRoutes.delete('/posts/:postId/like', async (c) => {
    const user = c.get('user');
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    try {
        await unlikePost(user.id, postId);
        const likesData = await getPostLikesData(user.id, postId);

        return c.json({ success: true, ...likesData });
    } catch (error) {
        return c.json({ error: 'Failed to unlike post' }, 500);
    }
});

postsRoutes.get('/posts/:postId/likes', async (c) => {
    const user = c.get('user');
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    try {
        const likesData = await getPostLikesData(user.id, postId);
        return c.json(likesData);
    } catch (error) {
        return c.json({ error: 'Failed to get likes data' }, 500);
    }
});

postsRoutes.get('/posts/:postId/likes/users', async (c) => {
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    try {
        const likesUsers = await getPostLikesUsers(postId);
        return c.json(likesUsers);
    } catch (error) {
        return c.json({ error: 'Failed to get likes users' }, 500);
    }
});

export { postsRoutes };
