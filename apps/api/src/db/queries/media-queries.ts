import { schema } from '@sound-connect/drizzle';
import { db } from '../index';
import { mediaSchema, mediaTypeSchema } from '@sound-connect/common/types/models';
import z from 'zod';

const { mediaTable } = schema;

export const addMedia = async (postId: number, mediaKeys: string[]) => {
    if (mediaKeys.length === 0) {
        return [];
    }

    const values = mediaKeys.map((mediaKey) => ({
        postId,
        key: mediaKey,
        type: mediaTypeSchema.parse('image')
    }));

    const results = await db.insert(mediaTable).values(values).returning();

    return z.array(mediaSchema).parse(results);
};
