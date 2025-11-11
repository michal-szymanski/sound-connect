import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import {
    updateInstrumentsSchema,
    updateGenresSchema,
    updateAvailabilitySchema,
    updateExperienceSchema,
    updateLogisticsSchema,
    updateLookingForSchema,
    updateBioSchema,
    completeSetupSchema
} from '@/common/types/profile';
import {
    updateUserProfileInstruments,
    updateUserProfileGenres,
    updateUserProfileAvailability,
    updateUserProfileExperience,
    updateUserProfileLogistics,
    updateUserProfileLookingFor,
    updateUserProfileBio,
    completeUserProfileSetup,
    getUserProfile
} from '@/api/db/queries/profile-queries';
import { canViewProfile } from '@/api/db/queries/settings-queries';

const profileRoutes = new Hono<HonoContext>();

profileRoutes.patch('/users/profile/instruments', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    const data = updateInstrumentsSchema.parse(body);

    const profileCompletion = await updateUserProfileInstruments(currentUser.id, data);

    return c.json({
        success: true,
        profileCompletion
    });
});

profileRoutes.patch('/users/profile/genres', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    const data = updateGenresSchema.parse(body);

    const profileCompletion = await updateUserProfileGenres(currentUser.id, data);

    return c.json({
        success: true,
        profileCompletion
    });
});

profileRoutes.patch('/users/profile/availability', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    const data = updateAvailabilitySchema.parse(body);

    const profileCompletion = await updateUserProfileAvailability(currentUser.id, data);

    return c.json({
        success: true,
        profileCompletion
    });
});

profileRoutes.patch('/users/profile/experience', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    const data = updateExperienceSchema.parse(body);

    const profileCompletion = await updateUserProfileExperience(currentUser.id, data);

    return c.json({
        success: true,
        profileCompletion
    });
});

profileRoutes.patch('/users/profile/logistics', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    const data = updateLogisticsSchema.parse(body);

    const profileCompletion = await updateUserProfileLogistics(currentUser.id, data);

    return c.json({
        success: true,
        profileCompletion
    });
});

profileRoutes.patch('/users/profile/looking-for', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    const data = updateLookingForSchema.parse(body);

    const profileCompletion = await updateUserProfileLookingFor(currentUser.id, data);

    return c.json({
        success: true,
        profileCompletion
    });
});

profileRoutes.patch('/users/profile/bio', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    const data = updateBioSchema.parse(body);

    const profileCompletion = await updateUserProfileBio(currentUser.id, data);

    return c.json({
        success: true,
        profileCompletion
    });
});

profileRoutes.post('/users/profile/complete-setup', async (c) => {
    const currentUser = c.get('user');
    const body = await c.req.json();
    completeSetupSchema.parse(body);

    try {
        const profileCompletion = await completeUserProfileSetup(currentUser.id);

        return c.json({
            success: true,
            profileCompletion
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Required fields not completed') {
                throw new HTTPException(400, {
                    message: 'Required fields not completed: city, primaryInstrument, primaryGenre'
                });
            }
            if (error.message === 'Profile not found') {
                throw new HTTPException(400, {
                    message: 'Profile not found. Please complete required fields first.'
                });
            }
        }
        throw error;
    }
});

profileRoutes.get('/users/:userId/profile', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const currentUser = c.get('user');

    const allowed = await canViewProfile(currentUser.id, userId);

    if (!allowed) {
        throw new HTTPException(403, { message: 'Cannot view this profile' });
    }

    const profile = await getUserProfile(userId);

    if (!profile) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    return c.json(profile);
});

export { profileRoutes };
