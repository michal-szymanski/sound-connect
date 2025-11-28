import { schema } from '@/drizzle';
import { musicSampleDbSchema } from '@sound-connect/common/types/drizzle';
import type { InstrumentEnum } from '@sound-connect/common/types/profile-enums';
import { eq, and, asc, count } from 'drizzle-orm';
import z from 'zod';
import { db } from '../index';

const { musicSamplesTable } = schema;

type Instrument = (typeof InstrumentEnum)[number];

export type CreateMusicSampleInput = {
    userId: string;
    title: string;
    description?: string | null;
    instrument?: Instrument | null;
    mediaType: 'audio' | 'video';
    r2Key: string;
    durationSeconds?: number | null;
    fileSize: number;
    sortOrder: number;
};

export type UpdateMusicSampleInput = {
    title?: string;
    description?: string | null;
    instrument?: Instrument | null;
};

export async function getMusicSamplesByUserId(userId: string) {
    const results = await db.select().from(musicSamplesTable).where(eq(musicSamplesTable.userId, userId)).orderBy(asc(musicSamplesTable.sortOrder));

    const schema = z.array(musicSampleDbSchema);
    return schema.parse(results);
}

export async function getMusicSampleById(id: number) {
    const result = await db.select().from(musicSamplesTable).where(eq(musicSamplesTable.id, id)).get();

    if (!result) {
        return null;
    }

    return musicSampleDbSchema.parse(result);
}

export async function getMusicSampleCountByUserId(userId: string) {
    const [result] = await db.select({ count: count() }).from(musicSamplesTable).where(eq(musicSamplesTable.userId, userId));

    return result?.count ?? 0;
}

export async function createMusicSample(data: CreateMusicSampleInput) {
    const [result] = await db
        .insert(musicSamplesTable)
        .values({
            userId: data.userId,
            title: data.title,
            description: data.description ?? null,
            instrument: data.instrument ?? null,
            mediaType: data.mediaType,
            r2Key: data.r2Key,
            durationSeconds: data.durationSeconds ?? null,
            fileSize: data.fileSize,
            sortOrder: data.sortOrder,
            createdAt: new Date().toISOString(),
            updatedAt: null
        })
        .returning();

    return musicSampleDbSchema.parse(result);
}

export async function updateMusicSample(id: number, userId: string, data: UpdateMusicSampleInput) {
    const [result] = await db
        .update(musicSamplesTable)
        .set({
            title: data.title,
            description: data.description,
            instrument: data.instrument,
            updatedAt: new Date().toISOString()
        })
        .where(and(eq(musicSamplesTable.id, id), eq(musicSamplesTable.userId, userId)))
        .returning();

    if (!result) {
        return null;
    }

    return musicSampleDbSchema.parse(result);
}

export async function deleteMusicSample(id: number, userId: string) {
    const sample = await db
        .select()
        .from(musicSamplesTable)
        .where(and(eq(musicSamplesTable.id, id), eq(musicSamplesTable.userId, userId)))
        .get();

    if (!sample) {
        return null;
    }

    await db.delete(musicSamplesTable).where(eq(musicSamplesTable.id, id));

    return musicSampleDbSchema.parse(sample);
}

export async function reorderMusicSamples(userId: string, orderedIds: number[]) {
    for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        if (id === undefined) continue;

        await db
            .update(musicSamplesTable)
            .set({ sortOrder: i, updatedAt: new Date().toISOString() })
            .where(and(eq(musicSamplesTable.id, id), eq(musicSamplesTable.userId, userId)));
    }

    return getMusicSamplesByUserId(userId);
}
