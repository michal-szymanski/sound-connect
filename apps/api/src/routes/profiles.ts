import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import { lookupProfileByUsername, isUsernameGloballyAvailable } from '@/api/db/queries/profile-queries';
import { profileLookupParamsSchema } from '@/common/types/profile-lookup';
import { globalUsernameAvailabilityResponseSchema } from '@/common/types/settings';

const profilesRoutes = new Hono<HonoContext>();

profilesRoutes.get('/profiles/:username', async (c) => {
    const { username } = profileLookupParamsSchema.parse(c.req.param());

    const profile = await lookupProfileByUsername(username);

    if (!profile) {
        throw new HTTPException(404, { message: 'Profile not found' });
    }

    return c.json({ profile });
});

profilesRoutes.get('/usernames/check', async (c) => {
    const { username } = z.object({ username: z.string().min(1) }).parse({
        username: c.req.query('username')
    });

    const result = await isUsernameGloballyAvailable(username);

    const response = globalUsernameAvailabilityResponseSchema.parse({
        available: result.available,
        username,
        takenBy: result.takenBy
    });

    return c.json(response);
});

export { profilesRoutes };
