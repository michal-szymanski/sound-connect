import { Hono } from 'hono';
import { z } from 'zod';
import { HonoContext } from 'types';
import { addPost, getFeed, getPostsByUserId, getReactions } from '@/api/db/queries/posts-queries';

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

export { postsRoutes };
