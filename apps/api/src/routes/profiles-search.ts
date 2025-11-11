import { Hono } from 'hono';
import type { HonoContext } from 'types';
import { profileSearchParamsSchema } from '@sound-connect/common/types/profile-search';
import { searchProfiles } from '@/api/db/queries/profiles-search-queries';
import { geocodeCity } from '@/api/services/geocoding-service';

const profilesSearchRoutes = new Hono<HonoContext>();

profilesSearchRoutes.get('/search', async (c) => {
    const db = c.env.DB;
    const currentUser = c.get('user');
    const query = c.req.query();

    const rawParams = {
        instruments: query['instruments[]'] ? (Array.isArray(query['instruments[]']) ? query['instruments[]'] : [query['instruments[]']]) : undefined,
        genres: query['genres[]'] ? (Array.isArray(query['genres[]']) ? query['genres[]'] : [query['genres[]']]) : undefined,
        city: query['city'],
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

    let geocodedLocation = null;
    let geocodingFallback = false;

    if (params.city) {
        geocodedLocation = await geocodeCity(db, { city: params.city });
        if (!geocodedLocation) {
            geocodingFallback = true;
        }
    }

    const results = await searchProfiles(db, params, geocodedLocation, currentUser.id);

    return c.json({
        results: results.data,
        pagination: results.pagination,
        geocodingFallback
    });
});

export { profilesSearchRoutes };
