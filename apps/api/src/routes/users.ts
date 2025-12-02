import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import {
    getFollowedUsers,
    getUserFollowers,
    getUserById,
    unfollowUser,
    getContacts,
    followUser,
    updateUserImage,
    updateUserBackgroundImage,
    getUserByUsername
} from '@/api/db/queries/users-queries';
import { notificationQueueMessageSchema } from '@/common/types/notifications';
import { canViewProfile, canFollow } from '@/api/db/queries/settings-queries';
import { profileSearchParamsSchema } from '@sound-connect/common/types/profile-search';
import { searchProfiles } from '@/api/db/queries/profiles-search-queries';
import {
    updateProfileImageSchema,
    updateProfileImageResponseSchema,
    updateBackgroundImageSchema,
    updateBackgroundImageResponseSchema
} from '@sound-connect/common/types/profile';

const usersRoutes = new Hono<HonoContext>();

usersRoutes.get('/users/search', async (c) => {
    const db = c.env.DB;
    const currentUser = c.get('user');
    const query = c.req.query();

    const rawParams = {
        instruments: query['instruments[]'] ? (Array.isArray(query['instruments[]']) ? query['instruments[]'] : [query['instruments[]']]) : undefined,
        genres: query['genres[]'] ? (Array.isArray(query['genres[]']) ? query['genres[]'] : [query['genres[]']]) : undefined,
        city: query['city'],
        latitude: query['latitude'] ? parseFloat(query['latitude']) : undefined,
        longitude: query['longitude'] ? parseFloat(query['longitude']) : undefined,
        radius: query['radius'],
        availabilityStatus: query['availabilityStatus[]']
            ? Array.isArray(query['availabilityStatus[]'])
                ? query['availabilityStatus[]']
                : [query['availabilityStatus[]']]
            : undefined,
        page: query['page'],
        limit: query['limit']
    };

    const params = profileSearchParamsSchema.parse(rawParams);

    const results = await searchProfiles(db, params, currentUser.id);

    return c.json({
        results: results.data,
        pagination: results.pagination
    });
});

usersRoutes.get('/users/:userId/followers', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const followersResults = await getUserFollowers(userId);
    return c.json(followersResults);
});

usersRoutes.get('/users/:userId/followings', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const followingsResults = await getFollowedUsers(userId);
    return c.json(followingsResults);
});

usersRoutes.post('/users/:userId/follow', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const user = c.get('user');

    const followPermission = await canFollow(user.id, userId);

    if (followPermission === 'blocked') {
        throw new HTTPException(403, { message: 'Cannot follow this user' });
    }

    if (followPermission === 'approval') {
        throw new HTTPException(403, { message: 'This user requires approval to follow' });
    }

    const currentUserFollowedUsers = await getFollowedUsers(user.id);
    if (currentUserFollowedUsers.some((followed) => followed.id === userId)) {
        throw new HTTPException(400, { message: 'Already following this user' });
    }

    await followUser(user.id, userId);

    const currentUserData = await getUserById(user.id);

    const queueMessage = notificationQueueMessageSchema.parse({
        userId: userId,
        type: 'follow_request',
        actorId: user.id,
        actorName: currentUserData.name,
        content: `${currentUserData.name} started following you`
    });

    await c.env.NotificationsQueue.send(queueMessage);

    return c.json({ success: true });
});

usersRoutes.post('/users/:userId/unfollow', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const user = c.get('user');
    await unfollowUser(user.id, userId);

    return c.json('ok');
});

usersRoutes.get('/users/:userId/contacts', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const usersResults = await getContacts(userId);
    return c.json(usersResults);
});

usersRoutes.get('/users/:userId/follow-request-status', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const user = c.get('user');

    const followedUsers = await getFollowedUsers(user.id);
    if (followedUsers.some((followed) => followed.id === userId)) {
        return c.json({ status: 'following' });
    }

    return c.json({ status: 'none' });
});

usersRoutes.patch('/users/me/image', async (c) => {
    const user = c.get('user');

    const body = await c.req.json();
    const data = updateProfileImageSchema.parse(body);

    const updated = await updateUserImage(user.id, data.imageUrl);

    if (!updated) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    return c.json(updateProfileImageResponseSchema.parse(updated));
});

usersRoutes.patch('/users/me/background-image', async (c) => {
    const user = c.get('user');

    const body = await c.req.json();
    const data = updateBackgroundImageSchema.parse(body);

    const updated = await updateUserBackgroundImage(user.id, data.backgroundImage);

    if (!updated) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    return c.json(updateBackgroundImageResponseSchema.parse(updated));
});

usersRoutes.get('/users/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const currentUser = c.get('user');

    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidPattern.test(userId);

    let user = null;
    let targetUserId = userId;

    if (!isUUID) {
        user = await getUserByUsername(userId);
        if (user) {
            targetUserId = user.id;
        }
    }

    if (!user) {
        user = await getUserById(targetUserId);
    }

    if (!user) {
        throw new HTTPException(404, { message: `User not found` });
    }

    const allowed = await canViewProfile(currentUser.id, user.id);

    if (!allowed) {
        throw new HTTPException(403, { message: 'Cannot view this profile' });
    }

    return c.json(user);
});

export { usersRoutes };
