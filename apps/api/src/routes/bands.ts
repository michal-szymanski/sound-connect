import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import { createBandInputSchema, updateBandInputSchema, addBandMemberInputSchema, userBandsResponseSchema } from '@sound-connect/common/types/bands';
import { createBandPostInputSchema, bandPostsResponseSchema } from '@sound-connect/common/types/band-posts';
import {
    followBandResponseSchema,
    bandFollowersResponseSchema,
    bandFollowerCountSchema,
    isFollowingBandSchema
} from '@sound-connect/common/types/band-follows';
import { createBandApplicationSchema, rejectBandApplicationSchema, applicationStatusEnum } from '@sound-connect/common/types/band-applications';
import { postQueueMessageSchema } from '@sound-connect/common/types/posts';
import { notificationQueueMessageSchema } from '@sound-connect/common/types/notifications';
import {
    createBand,
    getBandById,
    updateBand,
    deleteBand,
    isBandAdmin,
    addBandMember,
    removeBandMember,
    isBandMember,
    getAdminCount,
    getUserBands,
    userExists
} from '@/api/db/queries/bands-queries';
import { createBandPost, getBandPosts } from '@/api/db/queries/band-posts-queries';
import {
    followBand as followBandQuery,
    unfollowBand,
    getBandFollowers,
    getBandFollowerCount,
    isFollowingBand as isFollowingBandQuery,
    bandExists
} from '@/api/db/queries/band-follows-queries';
import {
    createBandApplication,
    getBandApplications,
    getApplicationById,
    hasPendingApplication,
    hasRejectedApplicationInCurrentPeriod,
    updateApplicationStatus,
    rejectPendingApplicationsForBand,
    deleteRejectedApplicationsForBand,
    getBandAdminIds
} from '@/api/db/queries/band-applications-queries';
import { geocodeCity } from '@/api/services/geocoding-service';

const bandsRoutes = new Hono<HonoContext>();

bandsRoutes.post('/bands', async (c) => {
    const user = c.get('user');

    const body = await c.req.json();
    const data = createBandInputSchema.parse(body);

    const geocodingResult = await geocodeCity(c.env.DB, { city: `${data.city}, ${data.state}` });

    if (!geocodingResult) {
        throw new HTTPException(400, { message: 'Could not find location. Please check city and state.' });
    }

    const band = await createBand(
        {
            ...data,
            latitude: geocodingResult.latitude,
            longitude: geocodingResult.longitude
        },
        user.id
    );

    return c.json(band, 201);
});

bandsRoutes.get('/bands/:id', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');
    const userId = user?.id;

    const band = await getBandById(id, userId);

    if (!band) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    return c.json(band);
});

bandsRoutes.patch('/bands/:id', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const isAdmin = await isBandAdmin(id, user.id);
    if (!isAdmin) {
        throw new HTTPException(403, { message: 'Not authorized to edit this band' });
    }

    const body = await c.req.json();
    const data = updateBandInputSchema.parse(body);

    let latitude: number | undefined = undefined;
    let longitude: number | undefined = undefined;

    const band = await getBandById(id);
    if (!band) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    if (data.city !== undefined || data.state !== undefined) {
        const cityToGeocode = data.city ?? band.city;
        const stateToGeocode = data.state ?? band.state;

        if (cityToGeocode && stateToGeocode) {
            const geocodingResult = await geocodeCity(c.env.DB, { city: `${cityToGeocode}, ${stateToGeocode}` });

            if (!geocodingResult) {
                throw new HTTPException(400, { message: 'Could not find location. Please check city and state.' });
            }

            latitude = geocodingResult.latitude;
            longitude = geocodingResult.longitude;
        }
    }

    const wasRecruiting = Boolean(band.lookingFor);
    const isRecruiting = data.lookingFor !== undefined ? Boolean(data.lookingFor) : wasRecruiting;

    if (wasRecruiting && !isRecruiting) {
        await rejectPendingApplicationsForBand(id);
    } else if (!wasRecruiting && isRecruiting) {
        await deleteRejectedApplicationsForBand(id);
    }

    const updatedBand = await updateBand(id, { ...data, latitude, longitude });

    return c.json(updatedBand);
});

bandsRoutes.delete('/bands/:id', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const isAdmin = await isBandAdmin(id, user.id);
    if (!isAdmin) {
        throw new HTTPException(403, { message: 'Not authorized to delete this band' });
    }

    await deleteBand(id);

    return c.body(null, 204);
});

bandsRoutes.post('/bands/:id/members', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const isAdmin = await isBandAdmin(id, user.id);
    if (!isAdmin) {
        throw new HTTPException(403, { message: 'Not authorized to add members to this band' });
    }

    const body = await c.req.json();
    const { userId } = addBandMemberInputSchema.parse(body);

    const userExistsCheck = await userExists(userId);
    if (!userExistsCheck) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    const alreadyMember = await isBandMember(id, userId);
    if (alreadyMember) {
        throw new HTTPException(400, { message: 'User is already a member of this band' });
    }

    const member = await addBandMember(id, userId);

    return c.json(member, 201);
});

bandsRoutes.delete('/bands/:id/members/:userId', async (c) => {
    const { id, userId } = z.object({ id: z.coerce.number().positive(), userId: z.string() }).parse(c.req.param());

    const user = c.get('user');

    const isAdmin = await isBandAdmin(id, user.id);
    if (!isAdmin) {
        throw new HTTPException(403, { message: 'Not authorized to remove members from this band' });
    }

    const memberExists = await isBandMember(id, userId);
    if (!memberExists) {
        throw new HTTPException(404, { message: 'Member not found' });
    }

    const memberIsAdmin = await isBandAdmin(id, userId);
    if (memberIsAdmin) {
        const adminCount = await getAdminCount(id);
        if (adminCount <= 1) {
            throw new HTTPException(400, { message: 'Cannot remove the last admin. Add another admin first or delete the band.' });
        }
    }

    await removeBandMember(id, userId);

    return c.body(null, 204);
});

bandsRoutes.get('/users/:userId/bands', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const userExistsCheck = await userExists(userId);
    if (!userExistsCheck) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    const bands = await getUserBands(userId);

    return c.json(userBandsResponseSchema.parse({ bands }));
});

bandsRoutes.post('/bands/:id/posts', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const exists = await bandExists(id);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const isAdmin = await isBandAdmin(id, user.id);
    if (!isAdmin) {
        throw new HTTPException(403, { message: 'Only band admins can create posts' });
    }

    const body = await c.req.json();
    const data = createBandPostInputSchema.parse(body);

    const post = await createBandPost(id, user.id, data);

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

bandsRoutes.get('/bands/:id/posts', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());

    const exists = await bandExists(id);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const { page = 1, limit = 20 } = z
        .object({
            page: z.coerce.number().int().positive().default(1),
            limit: z.coerce.number().int().positive().max(50).default(20)
        })
        .parse({
            page: c.req.query('page'),
            limit: c.req.query('limit')
        });

    const result = await getBandPosts(id, page, limit);

    return c.json(bandPostsResponseSchema.parse(result));
});

bandsRoutes.post('/bands/:id/follow', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const exists = await bandExists(id);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const isMember = await isBandMember(id, user.id);
    if (isMember) {
        throw new HTTPException(400, { message: 'You cannot follow a band you are a member of' });
    }

    const result = await followBandQuery(id, user.id);

    return c.json(followBandResponseSchema.parse(result), 201);
});

bandsRoutes.delete('/bands/:id/follow', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const exists = await bandExists(id);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    await unfollowBand(id, user.id);

    return c.body(null, 204);
});

bandsRoutes.get('/bands/:id/followers', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());

    const exists = await bandExists(id);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const { page = 1, limit = 50 } = z
        .object({
            page: z.coerce.number().int().positive().default(1),
            limit: z.coerce.number().int().positive().max(100).default(50)
        })
        .parse({
            page: c.req.query('page'),
            limit: c.req.query('limit')
        });

    const result = await getBandFollowers(id, page, limit);

    return c.json(bandFollowersResponseSchema.parse(result));
});

bandsRoutes.get('/bands/:id/followers/count', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());

    const exists = await bandExists(id);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const count = await getBandFollowerCount(id);

    return c.json(bandFollowerCountSchema.parse({ count }));
});

bandsRoutes.get('/bands/:id/is-following', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const exists = await bandExists(id);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const isFollowing = await isFollowingBandQuery(id, user.id);

    return c.json(isFollowingBandSchema.parse({ isFollowing }));
});

bandsRoutes.post('/bands/:bandId/applications', async (c) => {
    const { bandId } = z.object({ bandId: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const exists = await bandExists(bandId);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const band = await getBandById(bandId);
    if (!band || !band.lookingFor) {
        throw new HTTPException(400, { message: 'This band is not currently recruiting' });
    }

    const isMember = await isBandMember(bandId, user.id);
    if (isMember) {
        throw new HTTPException(400, { message: 'You are already a member of this band' });
    }

    const hasPending = await hasPendingApplication(bandId, user.id);
    if (hasPending) {
        throw new HTTPException(400, { message: 'You already have a pending application to this band' });
    }

    const hasRejected = await hasRejectedApplicationInCurrentPeriod(bandId, user.id);
    if (hasRejected) {
        throw new HTTPException(400, { message: 'You cannot re-apply during this recruitment period' });
    }

    const body = await c.req.json();
    const data = createBandApplicationSchema.parse(body);

    const application = await createBandApplication(bandId, user.id, data);

    const adminIds = await getBandAdminIds(bandId);
    const position = data.position ? ` as ${data.position}` : '';

    for (const adminId of adminIds) {
        const queueMessage = notificationQueueMessageSchema.parse({
            userId: adminId,
            type: 'band_application_received',
            actorId: user.id,
            actorName: user.name,
            entityId: String(bandId),
            entityType: 'band',
            content: `${user.name} applied to join ${band.name}${position}`
        });

        await c.env.NotificationsQueue.send(queueMessage);
    }

    return c.json({ success: true, application }, 201);
});

bandsRoutes.get('/bands/:bandId/applications', async (c) => {
    const { bandId } = z.object({ bandId: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const exists = await bandExists(bandId);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const isAdmin = await isBandAdmin(bandId, user.id);
    if (!isAdmin) {
        throw new HTTPException(403, { message: 'You must be a band admin to view applications' });
    }

    const {
        status = 'pending',
        limit = 20,
        offset = 0
    } = z
        .object({
            status: applicationStatusEnum.default('pending'),
            limit: z.coerce.number().int().positive().max(100).default(20),
            offset: z.coerce.number().int().min(0).default(0)
        })
        .parse({
            status: c.req.query('status'),
            limit: c.req.query('limit'),
            offset: c.req.query('offset')
        });

    const { applications, total } = await getBandApplications(bandId, status, limit, offset);

    return c.json({
        applications,
        total,
        hasMore: offset + applications.length < total
    });
});

bandsRoutes.get('/bands/:bandId/application-status', async (c) => {
    const { bandId } = z.object({ bandId: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const exists = await bandExists(bandId);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const hasApplied = await hasPendingApplication(bandId, user.id);
    const isRejected = await hasRejectedApplicationInCurrentPeriod(bandId, user.id);

    return c.json({
        hasApplied,
        isRejected
    });
});

bandsRoutes.patch('/bands/:bandId/applications/:applicationId/accept', async (c) => {
    const { bandId, applicationId } = z.object({ bandId: z.coerce.number().positive(), applicationId: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const exists = await bandExists(bandId);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const isAdmin = await isBandAdmin(bandId, user.id);
    if (!isAdmin) {
        throw new HTTPException(403, { message: 'You must be a band admin to accept applications' });
    }

    const application = await getApplicationById(applicationId);
    if (!application) {
        throw new HTTPException(404, { message: 'Application not found' });
    }

    if (application.bandId !== bandId) {
        throw new HTTPException(403, { message: 'Application does not belong to this band' });
    }

    if (application.status !== 'pending') {
        throw new HTTPException(400, { message: 'Application has already been processed' });
    }

    const band = await getBandById(bandId);
    if (!band) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const alreadyMember = await isBandMember(bandId, application.userId);
    if (alreadyMember) {
        const updatedApplication = await updateApplicationStatus(applicationId, 'accepted');
        return c.json({
            application: updatedApplication,
            message: 'User was already a member. Application marked as accepted.'
        });
    }

    const member = await addBandMember(bandId, application.userId);
    const updatedApplication = await updateApplicationStatus(applicationId, 'accepted');

    const queueMessage = notificationQueueMessageSchema.parse({
        userId: application.userId,
        type: 'band_application_accepted',
        actorId: user.id,
        actorName: user.name,
        entityId: String(bandId),
        entityType: 'band',
        content: `Your application to ${band.name} has been accepted!`
    });

    await c.env.NotificationsQueue.send(queueMessage);

    return c.json({
        success: true,
        application: updatedApplication,
        member: {
            id: 0,
            userId: member.userId,
            bandId,
            isAdmin: member.isAdmin,
            joinedAt: member.joinedAt
        }
    });
});

bandsRoutes.patch('/bands/:bandId/applications/:applicationId/reject', async (c) => {
    const { bandId, applicationId } = z.object({ bandId: z.coerce.number().positive(), applicationId: z.coerce.number().positive() }).parse(c.req.param());

    const user = c.get('user');

    const exists = await bandExists(bandId);
    if (!exists) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const isAdmin = await isBandAdmin(bandId, user.id);
    if (!isAdmin) {
        throw new HTTPException(403, { message: 'You must be a band admin to reject applications' });
    }

    const application = await getApplicationById(applicationId);
    if (!application) {
        throw new HTTPException(404, { message: 'Application not found' });
    }

    if (application.bandId !== bandId) {
        throw new HTTPException(403, { message: 'Application does not belong to this band' });
    }

    if (application.status !== 'pending') {
        throw new HTTPException(400, { message: 'Application has already been processed' });
    }

    const band = await getBandById(bandId);
    if (!band) {
        throw new HTTPException(404, { message: 'Band not found' });
    }

    const body = await c.req.json();
    const data = rejectBandApplicationSchema.parse(body);

    const updatedApplication = await updateApplicationStatus(applicationId, 'rejected', data.feedbackMessage);

    let notificationContent = `Your application to ${band.name} has been declined.`;
    if (data.feedbackMessage) {
        notificationContent += ` ${data.feedbackMessage}`;
    }

    const queueMessage = notificationQueueMessageSchema.parse({
        userId: application.userId,
        type: 'band_application_rejected',
        actorId: user.id,
        actorName: user.name,
        entityId: String(bandId),
        entityType: 'band',
        content: notificationContent
    });

    await c.env.NotificationsQueue.send(queueMessage);

    return c.json({ success: true, application: updatedApplication });
});

export { bandsRoutes };
