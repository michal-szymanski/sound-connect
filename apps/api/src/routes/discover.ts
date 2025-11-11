import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HonoContext } from 'types';
import { bandDiscoveryParamsSchema, discoveryAnalyticsEventSchema } from '@sound-connect/common/types/band-discovery';
import { discoverBands, trackDiscoveryEvent } from '../db/queries/band-discovery-queries';

const discoverRoutes = new Hono<HonoContext>();

discoverRoutes.get('/discover/bands', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;

    const query = c.req.query();

    const rawParams = {
        page: query['page'] ? Number(query['page']) : 1,
        limit: query['limit'] ? Number(query['limit']) : 12
    };

    const validationResult = bandDiscoveryParamsSchema.safeParse(rawParams);

    if (!validationResult.success) {
        throw new HTTPException(400, { message: 'Invalid page or limit parameter' });
    }

    const params = validationResult.data;

    try {
        const result = await discoverBands(db, user.id, params);
        return c.json(result);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Profile not found') {
                return c.json({
                    bands: [],
                    pagination: {
                        currentPage: 1,
                        totalPages: 0,
                        totalResults: 0,
                        hasNextPage: false,
                        hasPreviousPage: false
                    },
                    profileStatus: 'not_found',
                    missingFields: []
                });
            }

            if (error.message === 'Profile incomplete') {
                return c.json({
                    bands: [],
                    pagination: {
                        currentPage: 1,
                        totalPages: 0,
                        totalResults: 0,
                        hasNextPage: false,
                        hasPreviousPage: false
                    },
                    profileStatus: 'incomplete',
                    missingFields: ['primaryInstrument', 'primaryGenre', 'city']
                });
            }
        }
        throw new HTTPException(500, { message: 'Failed to fetch band recommendations' });
    }
});

discoverRoutes.post('/discover/analytics/track', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;

    const body = await c.req.json();
    const validationResult = discoveryAnalyticsEventSchema.safeParse(body);

    if (!validationResult.success) {
        throw new HTTPException(400, { message: 'Invalid analytics event data' });
    }

    const event = validationResult.data;

    try {
        await trackDiscoveryEvent(db, user.id, event);
        return c.json({ success: true }, 201);
    } catch {
        throw new HTTPException(500, { message: 'Failed to track analytics event' });
    }
});

export { discoverRoutes };
