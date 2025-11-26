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
    getPostById,
    updatePost,
    deletePost,
    getMediaByPostId,
    deleteMediaByKeys,
    deleteCommentReactionsByPostId,
    deleteCommentsByPostId,
    deletePostReactionsByPostId
} from '@/api/db/queries/posts-queries';
import { addMedia } from '@/api/db/queries/media-queries';
import { isBandAdmin } from '@/api/db/queries/bands-queries';
import { postQueueMessageSchema, createUserPostInputSchema } from '@/common/types/posts';

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
    const user = c.get('user');

    const body = await c.req.json();
    const data = createUserPostInputSchema.parse(body);

    const post = await addPost(user.id, data);

    const mediaKeys = data.media?.map((m) => m.key) ?? [];

    const queueMessage = postQueueMessageSchema.parse({
        postId: post.id,
        userId: user.id,
        content: data.content,
        mediaKeys
    });

    await c.env.PostsQueue.send(queueMessage);

    return c.json(post, 201);
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

    const user = c.get('user');
    const feedResults = await getFeed(limit, offset, user?.id);

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

    const post = await getPostById(postId);

    if (!post) {
        throw new HTTPException(404, { message: 'Post not found' });
    }

    if (post.post.authorType === 'user' && post.post.userId === user.id) {
        throw new HTTPException(403, { message: 'Cannot like your own post' });
    }

    if (post.post.authorType === 'band' && post.post.bandId) {
        const isAdmin = await isBandAdmin(post.post.bandId, user.id);
        if (isAdmin) {
            throw new HTTPException(403, { message: 'Cannot like your own post' });
        }
    }

    await likePost(user.id, postId);
    const likesData = await getPostLikesData(user.id, postId);

    return c.json({ success: true, ...likesData });
});

postsRoutes.delete('/posts/:postId/like', async (c) => {
    const user = c.get('user');
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    const post = await getPostById(postId);

    if (!post) {
        throw new HTTPException(404, { message: 'Post not found' });
    }

    if (post.post.authorType === 'user' && post.post.userId === user.id) {
        throw new HTTPException(403, { message: 'Cannot like your own post' });
    }

    if (post.post.authorType === 'band' && post.post.bandId) {
        const isAdmin = await isBandAdmin(post.post.bandId, user.id);
        if (isAdmin) {
            throw new HTTPException(403, { message: 'Cannot like your own post' });
        }
    }

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

postsRoutes.put('/posts/:postId', async (c) => {
    const user = c.get('user');
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    const post = await getPostById(postId);

    if (!post) {
        throw new HTTPException(404, { message: 'Post not found' });
    }

    let isAuthorized = false;
    if (post.post.authorType === 'user' && post.post.userId === user.id) {
        isAuthorized = true;
    } else if (post.post.authorType === 'band' && post.post.bandId) {
        const isAdmin = await isBandAdmin(post.post.bandId, user.id);
        if (isAdmin) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        throw new HTTPException(403, { message: 'Not authorized to edit this post' });
    }

    const body = await c.req.json();
    const { content, mediaKeysToKeep, newMediaKeys } = z
        .object({
            content: z.string().min(1).max(5000),
            mediaKeysToKeep: z.array(z.string()).optional().default([]),
            newMediaKeys: z.array(z.string()).optional().default([])
        })
        .parse(body);

    await updatePost(postId, content);

    const existingMedia = await getMediaByPostId(postId);
    const mediaKeysToDelete = existingMedia.filter((m) => !mediaKeysToKeep.includes(m.key)).map((m) => m.key);

    if (mediaKeysToDelete.length > 0) {
        await deleteMediaByKeys(postId, mediaKeysToDelete);

        for (const key of mediaKeysToDelete) {
            await c.env.ASSETS.delete(key);
        }
    }

    if (newMediaKeys.length > 0) {
        await addMedia(postId, newMediaKeys);
    }

    const updatedPostFull = await getPostById(postId);

    return c.json(updatedPostFull);
});

postsRoutes.delete('/posts/:postId', async (c) => {
    const user = c.get('user');
    const { postId } = z.object({ postId: z.coerce.number().positive() }).parse(c.req.param());

    const post = await getPostById(postId);

    if (!post) {
        throw new HTTPException(404, { message: 'Post not found' });
    }

    let isAuthorized = false;
    if (post.post.authorType === 'user' && post.post.userId === user.id) {
        isAuthorized = true;
    } else if (post.post.authorType === 'band' && post.post.bandId) {
        const isAdmin = await isBandAdmin(post.post.bandId, user.id);
        if (isAdmin) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        throw new HTTPException(403, { message: 'Not authorized to delete this post' });
    }

    await deleteCommentReactionsByPostId(postId);
    await deleteCommentsByPostId(postId);
    await deletePostReactionsByPostId(postId);

    const media = await getMediaByPostId(postId);

    for (const mediaItem of media) {
        await c.env.ASSETS.delete(mediaItem.key);
    }

    await deletePost(postId);

    return c.body(null, 204);
});

export { postsRoutes };
