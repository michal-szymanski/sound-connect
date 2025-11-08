import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import { createBandInputSchema, updateBandInputSchema, addBandMemberInputSchema, userBandsResponseSchema } from '@sound-connect/common/types/bands';
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

    if (data.city !== undefined || data.state !== undefined) {
        const band = await getBandById(id);
        if (!band) {
            throw new HTTPException(404, { message: 'Band not found' });
        }

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

export { bandsRoutes };
