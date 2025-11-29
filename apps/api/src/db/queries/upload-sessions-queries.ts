import { schema } from '@/drizzle';
import { eq, and, lt, isNull, inArray } from 'drizzle-orm';
import { db } from '../index';

const { uploadSessionsTable } = schema;

type CreateUploadSessionData = {
    id: string;
    userId: string;
    uploadType: 'profile-image' | 'band-image' | 'post-media' | 'music-sample' | 'background-image';
    bandId?: number;
    fileName: string;
    fileSize: number;
    contentType: string;
    tempKey: string;
    expiresAt: string;
};

export const createUploadSession = async (data: CreateUploadSessionData) => {
    const now = new Date().toISOString();

    const [session] = await db
        .insert(uploadSessionsTable)
        .values({
            id: data.id,
            userId: data.userId,
            uploadType: data.uploadType,
            bandId: data.bandId ?? null,
            fileName: data.fileName,
            fileSize: data.fileSize,
            contentType: data.contentType,
            tempKey: data.tempKey,
            expiresAt: data.expiresAt,
            createdAt: now,
            confirmedAt: null
        })
        .returning();

    return session;
};

export const getUploadSession = async (sessionId: string) => {
    const [session] = await db.select().from(uploadSessionsTable).where(eq(uploadSessionsTable.id, sessionId)).limit(1);

    return session || null;
};

export const confirmUploadSession = async (sessionId: string) => {
    const now = new Date().toISOString();

    const [session] = await db.update(uploadSessionsTable).set({ confirmedAt: now }).where(eq(uploadSessionsTable.id, sessionId)).returning();

    return session;
};

export const getExpiredUnconfirmedSessions = async (before: string) => {
    const sessions = await db
        .select()
        .from(uploadSessionsTable)
        .where(and(isNull(uploadSessionsTable.confirmedAt), lt(uploadSessionsTable.expiresAt, before)));

    return sessions;
};

export const deleteUploadSessions = async (sessionIds: string[]) => {
    if (sessionIds.length === 0) {
        return;
    }

    await db.delete(uploadSessionsTable).where(inArray(uploadSessionsTable.id, sessionIds));
};
