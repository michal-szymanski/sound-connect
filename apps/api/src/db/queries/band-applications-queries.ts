import { schema } from '@/drizzle';
import { eq, and, desc, isNotNull } from 'drizzle-orm';
import type { CreateBandApplicationInput, BandApplicationWithUser, BandApplication } from '@sound-connect/common/types/band-applications';
import { db } from '../index';

const { bandApplicationsTable, users, bandsMembersTable } = schema;

export const createBandApplication = async (bandId: number, userId: string, data: CreateBandApplicationInput): Promise<BandApplication> => {
    const now = new Date().toISOString();

    const [application] = await db
        .insert(bandApplicationsTable)
        .values({
            bandId,
            userId,
            message: data.message,
            position: data.position ?? null,
            musicLink: data.musicLink ?? null,
            status: 'pending',
            feedbackMessage: null,
            createdAt: now,
            updatedAt: now
        })
        .returning();

    if (!application) {
        throw new Error('Failed to create band application');
    }

    return application;
};

export const getBandApplications = async (
    bandId: number,
    status: 'pending' | 'accepted' | 'rejected' = 'pending',
    limit: number = 20,
    offset: number = 0
): Promise<{ applications: BandApplicationWithUser[]; total: number }> => {
    const applicationsResults = await db
        .select({
            id: bandApplicationsTable.id,
            bandId: bandApplicationsTable.bandId,
            userId: bandApplicationsTable.userId,
            username: users.username,
            userName: users.name,
            userImage: users.image,
            message: bandApplicationsTable.message,
            position: bandApplicationsTable.position,
            musicLink: bandApplicationsTable.musicLink,
            status: bandApplicationsTable.status,
            feedbackMessage: bandApplicationsTable.feedbackMessage,
            createdAt: bandApplicationsTable.createdAt,
            updatedAt: bandApplicationsTable.updatedAt
        })
        .from(bandApplicationsTable)
        .innerJoin(users, eq(bandApplicationsTable.userId, users.id))
        .where(and(eq(bandApplicationsTable.bandId, bandId), eq(bandApplicationsTable.status, status), isNotNull(users.username)))
        .orderBy(desc(bandApplicationsTable.createdAt))
        .limit(limit)
        .offset(offset);

    const applications: BandApplicationWithUser[] = applicationsResults.map((app) => ({
        id: app.id,
        bandId: app.bandId,
        userId: app.userId,
        username: app.username as string,
        userName: app.userName,
        userImage: app.userImage,
        message: app.message,
        position: app.position,
        musicLink: app.musicLink,
        status: app.status as 'pending' | 'accepted' | 'rejected',
        feedbackMessage: app.feedbackMessage,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
    }));

    const [countResult] = await db
        .select({ count: bandApplicationsTable.id })
        .from(bandApplicationsTable)
        .where(and(eq(bandApplicationsTable.bandId, bandId), eq(bandApplicationsTable.status, status)));

    const total = countResult ? 1 : 0;

    return { applications, total };
};

export const getApplicationById = async (applicationId: number): Promise<BandApplication | null> => {
    const [application] = await db.select().from(bandApplicationsTable).where(eq(bandApplicationsTable.id, applicationId)).limit(1);

    return application || null;
};

export const hasPendingApplication = async (bandId: number, userId: string): Promise<boolean> => {
    const [result] = await db
        .select({ id: bandApplicationsTable.id })
        .from(bandApplicationsTable)
        .where(and(eq(bandApplicationsTable.bandId, bandId), eq(bandApplicationsTable.userId, userId), eq(bandApplicationsTable.status, 'pending')))
        .limit(1);

    return Boolean(result);
};

export const hasRejectedApplicationInCurrentPeriod = async (bandId: number, userId: string): Promise<boolean> => {
    const [result] = await db
        .select({ id: bandApplicationsTable.id })
        .from(bandApplicationsTable)
        .where(and(eq(bandApplicationsTable.bandId, bandId), eq(bandApplicationsTable.userId, userId), eq(bandApplicationsTable.status, 'rejected')))
        .limit(1);

    return Boolean(result);
};

export const updateApplicationStatus = async (applicationId: number, status: 'accepted' | 'rejected', feedbackMessage?: string): Promise<BandApplication> => {
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
        status,
        updatedAt: now
    };

    if (feedbackMessage !== undefined) {
        updateData['feedbackMessage'] = feedbackMessage;
    }

    const [updated] = await db.update(bandApplicationsTable).set(updateData).where(eq(bandApplicationsTable.id, applicationId)).returning();

    if (!updated) {
        throw new Error('Failed to update application status');
    }

    return updated;
};

export const rejectPendingApplicationsForBand = async (bandId: number): Promise<BandApplication[]> => {
    const now = new Date().toISOString();

    const rejected = await db
        .update(bandApplicationsTable)
        .set({
            status: 'rejected',
            feedbackMessage: 'Recruitment period ended',
            updatedAt: now
        })
        .where(and(eq(bandApplicationsTable.bandId, bandId), eq(bandApplicationsTable.status, 'pending')))
        .returning();

    return rejected;
};

export const deleteRejectedApplicationsForBand = async (bandId: number): Promise<void> => {
    await db.delete(bandApplicationsTable).where(and(eq(bandApplicationsTable.bandId, bandId), eq(bandApplicationsTable.status, 'rejected')));
};

export const getBandAdminIds = async (bandId: number): Promise<string[]> => {
    const admins = await db
        .select({ userId: bandsMembersTable.userId })
        .from(bandsMembersTable)
        .where(and(eq(bandsMembersTable.bandId, bandId), eq(bandsMembersTable.isAdmin, true)));

    return admins.map((admin) => admin.userId);
};
