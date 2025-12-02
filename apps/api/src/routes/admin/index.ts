import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { Context, Next } from 'hono';
import { HonoContext } from 'types';
import {
    getAllUsers,
    getUserByIdAdmin,
    updateUserAdmin,
    deleteUserAdmin,
    getUserStats,
    countAdmins,
    getSignupStats,
    getInstrumentStats,
    getModerationStats,
    getLocationStats,
    getOnboardingStats,
    getBandStats
} from '@/api/db/queries/admin-queries';

const adminRoutes = new Hono<HonoContext>();

const adminMiddleware = async (c: Context<HonoContext>, next: Next) => {
    const currentUser = c.get('user');

    if (!currentUser) {
        throw new HTTPException(401, { message: 'Unauthorized' });
    }

    if (currentUser.role !== 'admin') {
        throw new HTTPException(403, { message: 'Admin access required' });
    }

    await next();
};

adminRoutes.use('/admin/*', adminMiddleware);

adminRoutes.get('/admin/users', async (c) => {
    const queryParams = z
        .object({
            search: z.string().optional(),
            limit: z.coerce.number().positive().max(100).optional().default(20),
            offset: z.coerce.number().min(0).optional().default(0)
        })
        .parse({
            search: c.req.query('search'),
            limit: c.req.query('limit'),
            offset: c.req.query('offset')
        });

    const result = await getAllUsers(queryParams);

    return c.json({
        users: result.users,
        total: result.total
    });
});

adminRoutes.get('/admin/users/:id', async (c) => {
    const { id } = z.object({ id: z.string() }).parse(c.req.param());

    const user = await getUserByIdAdmin(id);

    if (!user) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    return c.json(user);
});

adminRoutes.patch('/admin/users/:id', async (c) => {
    const { id } = z.object({ id: z.string() }).parse(c.req.param());

    const body = await c.req.json();
    const updateData = z
        .object({
            role: z.enum(['admin', 'user']).optional(),
            name: z.string().optional(),
            email: z.string().email().optional(),
            emailVerified: z.boolean().optional()
        })
        .parse(body);

    const user = await getUserByIdAdmin(id);
    if (!user) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    const updated = await updateUserAdmin(id, updateData);

    return c.json(updated);
});

adminRoutes.delete('/admin/users/:id', async (c) => {
    const { id } = z.object({ id: z.string() }).parse(c.req.param());
    const currentUser = c.get('user');

    if (currentUser.id === id) {
        throw new HTTPException(400, { message: 'You cannot delete your own account' });
    }

    const user = await getUserByIdAdmin(id);
    if (!user) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    if (user.role === 'admin') {
        const adminCount = await countAdmins();
        if (adminCount <= 1) {
            throw new HTTPException(400, { message: 'Cannot delete the last admin. At least one admin must exist.' });
        }
    }

    await deleteUserAdmin(id);

    return c.body(null, 204);
});

adminRoutes.get('/admin/stats', async (c) => {
    const stats = await getUserStats();

    return c.json({
        totalUsers: stats.totalUsers,
        recentSignups: stats.usersLast7Days
    });
});

adminRoutes.get('/admin/stats/signups', async (c) => {
    const { days } = z
        .object({
            days: z.coerce.number().int().positive().optional().default(30)
        })
        .parse({
            days: c.req.query('days')
        });

    if (![7, 30, 90].includes(days)) {
        throw new HTTPException(400, { message: 'Days must be 7, 30, or 90' });
    }

    const stats = await getSignupStats(days);

    return c.json(stats);
});

adminRoutes.get('/admin/stats/instruments', async (c) => {
    const stats = await getInstrumentStats();

    return c.json(stats);
});

adminRoutes.get('/admin/stats/moderation', async (c) => {
    const stats = await getModerationStats();

    return c.json(stats);
});

adminRoutes.get('/admin/stats/locations', async (c) => {
    const { limit } = z
        .object({
            limit: z.coerce.number().int().positive().max(50).optional().default(10)
        })
        .parse({
            limit: c.req.query('limit')
        });

    const stats = await getLocationStats(limit);

    return c.json(stats);
});

adminRoutes.get('/admin/stats/onboarding', async (c) => {
    const stats = await getOnboardingStats();

    return c.json(stats);
});

adminRoutes.get('/admin/stats/bands', async (c) => {
    const { weeks } = z
        .object({
            weeks: z.coerce.number().int().positive().optional().default(8)
        })
        .parse({
            weeks: c.req.query('weeks')
        });

    if (![4, 8, 12].includes(weeks)) {
        throw new HTTPException(400, { message: 'Weeks must be 4, 8, or 12' });
    }

    const stats = await getBandStats(weeks);

    return c.json(stats);
});

export { adminRoutes };
