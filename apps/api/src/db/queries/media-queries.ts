import { schema } from '@/drizzle';
import { db } from '../index';
import { mediaSchema } from '@/common/types/drizzle';
import z from 'zod';

const { mediaTable } = schema;

export const addMedia = async (postId: number, mediaKeys: string[], title?: string | null) => {
    if (mediaKeys.length === 0) {
        return [];
    }

    const values = mediaKeys.map((mediaKey) => ({
        postId,
        key: mediaKey,
        type: 'image' as const,
        title: title ?? null
    }));

    const results = await db.insert(mediaTable).values(values).returning();

    return z.array(mediaSchema).parse(results);
};
