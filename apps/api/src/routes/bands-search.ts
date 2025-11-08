import { Hono } from 'hono';
import type { HonoContext } from 'types';
import { bandSearchParamsSchema } from '@sound-connect/common/types/band-search';
import { searchBands } from '@/api/db/queries/bands-search-queries';
import { geocodeCity } from '@/api/services/geocoding-service';

const bandsSearchRoutes = new Hono<HonoContext>();

bandsSearchRoutes.get('/search', async (c) => {
    const db = c.env.DB;
    const query = c.req.query();

    const rawParams = {
        genre: query['genre'],
        city: query['city'],
        radius: query['radius'],
        lookingFor: query['lookingFor'],
        page: query['page'],
        limit: query['limit']
    };

    const params = bandSearchParamsSchema.parse(rawParams);

    let geocodedLocation = null;
    let geocodingFallback = false;

    if (params.city) {
        geocodedLocation = await geocodeCity(db, { city: params.city });
        if (!geocodedLocation) {
            geocodingFallback = true;
        }
    }

    const results = await searchBands(db, params, geocodedLocation);

    return c.json({
        results: results.data,
        pagination: results.pagination,
        geocodingFallback
    });
});

export { bandsSearchRoutes };
