import { schema } from '@/drizzle';
import { eq, like, or, desc, count, sql, gte } from 'drizzle-orm';
import { db } from '../index';

const { users } = schema;

export const getAllUsers = async (params: { search?: string; limit: number; offset: number }) => {
    const { search, limit, offset } = params;

    const baseQuery = db.select().from(users);

    const whereConditions = search ? or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)) : undefined;

    const results = await baseQuery.where(whereConditions).orderBy(desc(users.createdAt)).limit(limit).offset(offset);

    const [countResult] = await db.select({ count: count() }).from(users).where(whereConditions);

    return {
        users: results,
        total: countResult?.count || 0
    };
};

export const getUserByIdAdmin = async (userId: string) => {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    return user;
};

export const updateUserAdmin = async (
    userId: string,
    data: {
        role?: string;
        name?: string;
        email?: string;
        emailVerified?: boolean;
    }
) => {
    const [updated] = await db
        .update(users)
        .set({
            ...data,
            updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

    return updated;
};

export const deleteUserAdmin = async (userId: string) => {
    await db.delete(users).where(eq(users.id, userId));
};

export const getUserStats = async () => {
    const [totalUsersResult] = await db.select({ count: count() }).from(users);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [usersLast7DaysResult] = await db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, sql`cast(unixepoch('subsecond', ${sevenDaysAgo.toISOString()}) * 1000 as integer)`));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [usersLast30DaysResult] = await db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, sql`cast(unixepoch('subsecond', ${thirtyDaysAgo.toISOString()}) * 1000 as integer)`));

    return {
        totalUsers: totalUsersResult?.count || 0,
        usersLast7Days: usersLast7DaysResult?.count || 0,
        usersLast30Days: usersLast30DaysResult?.count || 0
    };
};
