import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { Context, Next } from 'hono';
import { HonoContext } from 'types';
import { getAllUsers, getUserByIdAdmin, updateUserAdmin, deleteUserAdmin, getUserStats } from '@/api/db/queries/admin-queries';

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

    const user = await getUserByIdAdmin(id);
    if (!user) {
        throw new HTTPException(404, { message: 'User not found' });
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

export { adminRoutes };
