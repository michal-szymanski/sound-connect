import { Hono } from 'hono';
import { HonoContext } from 'types';
import { searchUsers } from '@/api/db/queries/users-queries';

const searchRoutes = new Hono<HonoContext>();

searchRoutes.get('/search', async (c) => {
    const { query } = c.req.query();

    if (!query) {
        return c.json({ message: 'Query parameter is required' }, 400);
    }

    const searchResults = await searchUsers(query);

    return c.json(searchResults, 200);
});

export { searchRoutes };
