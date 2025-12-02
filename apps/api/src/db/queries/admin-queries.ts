import { schema } from '@/drizzle';
import { eq, like, or, desc, count, sql, gte, isNotNull } from 'drizzle-orm';
import { db } from '../index';

const { users, userProfilesTable, postsTable, bandsTable, bandApplicationsTable, userOnboardingTable } = schema;

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

export const countAdmins = async (): Promise<number> => {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, 'admin'));
    return result[0]?.count ?? 0;
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

export const getSignupStats = async (days: number) => {
    const startTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;

    const results = await db
        .select({
            date: sql<string>`DATE(${users.createdAt} / 1000, 'unixepoch')`,
            count: count()
        })
        .from(users)
        .where(sql`${users.createdAt} >= ${startTimestamp}`)
        .groupBy(sql`DATE(${users.createdAt} / 1000, 'unixepoch')`)
        .orderBy(sql`DATE(${users.createdAt} / 1000, 'unixepoch')`);

    const [totalResult] = await db.select({ count: count() }).from(users).where(sql`${users.createdAt} >= ${startTimestamp}`);

    return {
        data: results,
        total: totalResult?.count || 0
    };
};

export const getInstrumentStats = async () => {
    const results = await db
        .select({
            instrument: userProfilesTable.primaryInstrument,
            count: count()
        })
        .from(userProfilesTable)
        .where(isNotNull(userProfilesTable.primaryInstrument))
        .groupBy(userProfilesTable.primaryInstrument)
        .orderBy(desc(count()));

    const [totalResult] = await db.select({ count: count() }).from(userProfilesTable).where(isNotNull(userProfilesTable.primaryInstrument));

    const total = totalResult?.count || 0;

    return {
        data: results.map((row) => ({
            instrument: row.instrument || 'Unknown',
            count: row.count,
            percentage: total > 0 ? Math.round((row.count / total) * 100 * 100) / 100 : 0
        })),
        total
    };
};

export const getModerationStats = async () => {
    const [pendingResult] = await db.select({ count: count() }).from(postsTable).where(eq(postsTable.status, 'pending'));

    const [approvedResult] = await db.select({ count: count() }).from(postsTable).where(eq(postsTable.status, 'approved'));

    const [rejectedResult] = await db.select({ count: count() }).from(postsTable).where(eq(postsTable.status, 'rejected'));

    const [totalResult] = await db.select({ count: count() }).from(postsTable);

    const [lastModeratedResult] = await db
        .select({ moderatedAt: postsTable.moderatedAt })
        .from(postsTable)
        .where(isNotNull(postsTable.moderatedAt))
        .orderBy(desc(postsTable.moderatedAt))
        .limit(1);

    return {
        pending: pendingResult?.count || 0,
        approved: approvedResult?.count || 0,
        rejected: rejectedResult?.count || 0,
        total: totalResult?.count || 0,
        lastModerated: lastModeratedResult?.moderatedAt || null
    };
};

export const getLocationStats = async (limit: number) => {
    const results = await db
        .select({
            city: userProfilesTable.city,
            country: userProfilesTable.country,
            count: count()
        })
        .from(userProfilesTable)
        .where(isNotNull(userProfilesTable.city))
        .groupBy(userProfilesTable.city, userProfilesTable.country)
        .orderBy(desc(count()))
        .limit(limit + 1);

    const [totalResult] = await db.select({ count: count() }).from(userProfilesTable).where(isNotNull(userProfilesTable.city));

    const total = totalResult?.count || 0;
    const topResults = results.slice(0, limit);
    const hasMore = results.length > limit;

    const topCount = topResults.reduce((sum, row) => sum + row.count, 0);
    const othersCount = hasMore ? total - topCount : 0;

    return {
        data: topResults.map((row) => ({
            city: row.city || 'Unknown',
            country: row.country,
            count: row.count
        })),
        othersCount,
        total
    };
};

export const getOnboardingStats = async () => {
    const stepResults = await db
        .select({
            step: userOnboardingTable.currentStep,
            count: count()
        })
        .from(userOnboardingTable)
        .groupBy(userOnboardingTable.currentStep)
        .orderBy(userOnboardingTable.currentStep);

    const [completedResult] = await db.select({ count: count() }).from(userOnboardingTable).where(isNotNull(userOnboardingTable.completedAt));

    const [skippedResult] = await db.select({ count: count() }).from(userOnboardingTable).where(isNotNull(userOnboardingTable.skippedAt));

    const [inProgressResult] = await db
        .select({ count: count() })
        .from(userOnboardingTable)
        .where(sql`${userOnboardingTable.completedAt} IS NULL AND ${userOnboardingTable.skippedAt} IS NULL`);

    const [totalUsersResult] = await db.select({ count: count() }).from(users);

    const [onboardingUsersResult] = await db.select({ count: count() }).from(userOnboardingTable);

    const notStarted = (totalUsersResult?.count || 0) - (onboardingUsersResult?.count || 0);

    return {
        steps: stepResults.map((row) => ({
            step: row.step,
            usersAtStep: row.count
        })),
        completed: completedResult?.count || 0,
        skipped: skippedResult?.count || 0,
        inProgress: inProgressResult?.count || 0,
        notStarted
    };
};

export const getBandStats = async (weeks: number) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const results = await db
        .select({
            week: sql<string>`strftime('%Y-W%W', ${bandsTable.createdAt})`,
            bandsCreated: count()
        })
        .from(bandsTable)
        .where(gte(bandsTable.createdAt, startDate.toISOString()))
        .groupBy(sql`strftime('%Y-W%W', ${bandsTable.createdAt})`)
        .orderBy(sql`strftime('%Y-W%W', ${bandsTable.createdAt})`);

    const applicationsByWeek = await db
        .select({
            week: sql<string>`strftime('%Y-W%W', ${bandApplicationsTable.createdAt})`,
            applications: count()
        })
        .from(bandApplicationsTable)
        .where(gte(bandApplicationsTable.createdAt, startDate.toISOString()))
        .groupBy(sql`strftime('%Y-W%W', ${bandApplicationsTable.createdAt})`)
        .orderBy(sql`strftime('%Y-W%W', ${bandApplicationsTable.createdAt})`);

    const appsByWeekMap = new Map(applicationsByWeek.map((row) => [row.week, row.applications]));

    const [totalBandsResult] = await db.select({ count: count() }).from(bandsTable).where(gte(bandsTable.createdAt, startDate.toISOString()));

    const [totalApplicationsResult] = await db
        .select({ count: count() })
        .from(bandApplicationsTable)
        .where(gte(bandApplicationsTable.createdAt, startDate.toISOString()));

    return {
        data: results.map((row) => ({
            week: row.week,
            bandsCreated: row.bandsCreated,
            applications: appsByWeekMap.get(row.week) || 0
        })),
        totalBands: totalBandsResult?.count || 0,
        totalApplications: totalApplicationsResult?.count || 0
    };
};
