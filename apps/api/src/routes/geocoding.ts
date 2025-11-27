import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { HonoContext } from 'types';
import { autocompleteLocation } from '@/api/services/geocoding-service';
import { locationAutocompleteRequestSchema, locationAutocompleteResponseSchema } from '@sound-connect/common/types/location';

const geocodingRoutes = new Hono<HonoContext>();

geocodingRoutes.get('/geocoding/autocomplete', async (c) => {
    const queryParam = c.req.query('q');

    const { query } = locationAutocompleteRequestSchema.parse({ query: queryParam });

    const accessToken = c.env.MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
        throw new HTTPException(500, { message: 'Mapbox access token not configured' });
    }

    const suggestions = await autocompleteLocation(query, accessToken);

    const response = locationAutocompleteResponseSchema.parse({ suggestions });

    return c.json(response);
});

export { geocodingRoutes };
