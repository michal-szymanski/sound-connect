import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { HonoContext } from 'types';
import { profileSearchParamsSchema } from '@sound-connect/common/types/profile-search';
import { searchProfiles } from '@/api/db/queries/profiles-search-queries';
import { geocodeCity } from '@/api/services/geocoding-service';

const profilesSearchRoutes = new Hono<HonoContext>();

profilesSearchRoutes.get('/search', zValidator('query', profileSearchParamsSchema), async (c) => {
    const params = c.req.valid('query');
    const db = c.env.DB;

    let geocodedLocation = null;
    let geocodingFallback = false;

    if (params.city) {
        geocodedLocation = await geocodeCity(db, { city: params.city });
        if (!geocodedLocation) {
            geocodingFallback = true;
        }
    }

    const results = await searchProfiles(db, params, geocodedLocation);

    return c.json({
        results: results.data,
        pagination: results.pagination,
        geocodingFallback
    });
});

export { profilesSearchRoutes };
