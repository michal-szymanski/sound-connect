import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';
import { createMusicSampleSchema, updateMusicSampleSchema, reorderMusicSamplesSchema } from '@sound-connect/common/types/music-samples';
import { appConfig } from '@sound-connect/common/app-config';
import {
    getMusicSamplesByUserId,
    getMusicSampleById,
    getMusicSampleCountByUserId,
    createMusicSample,
    updateMusicSample,
    deleteMusicSample,
    reorderMusicSamples
} from '@/api/db/queries/music-samples-queries';
import { deleteR2Object } from '@/api/services/r2-service';

const musicSamplesRoutes = new Hono<HonoContext>();

musicSamplesRoutes.get('/users/:userId/music-samples', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());

    const samples = await getMusicSamplesByUserId(userId);

    return c.json(samples);
});

musicSamplesRoutes.post('/users/music-samples', async (c) => {
    const user = c.get('user');

    const currentCount = await getMusicSampleCountByUserId(user.id);
    if (currentCount >= appConfig.maxMusicSampleCount) {
        throw new HTTPException(400, { message: `Maximum of ${appConfig.maxMusicSampleCount} music samples allowed` });
    }

    const body = await c.req.json();
    const data = createMusicSampleSchema.parse(body);

    const sortOrder = currentCount;

    const sample = await createMusicSample({
        userId: user.id,
        title: data.title,
        description: data.description,
        instrument: data.instrument,
        mediaType: data.mediaType,
        r2Key: data.r2Key,
        durationSeconds: data.durationSeconds,
        fileSize: data.fileSize,
        sortOrder
    });

    return c.json(sample, 201);
});

musicSamplesRoutes.put('/users/music-samples/:id', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());
    const user = c.get('user');

    const existingSample = await getMusicSampleById(id);
    if (!existingSample) {
        throw new HTTPException(404, { message: 'Music sample not found' });
    }

    if (existingSample.userId !== user.id) {
        throw new HTTPException(403, { message: 'Not authorized to update this music sample' });
    }

    const body = await c.req.json();
    const data = updateMusicSampleSchema.parse(body);

    const updatedSample = await updateMusicSample(id, user.id, data);

    if (!updatedSample) {
        throw new HTTPException(404, { message: 'Music sample not found' });
    }

    return c.json(updatedSample);
});

musicSamplesRoutes.delete('/users/music-samples/:id', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());
    const user = c.get('user');

    const deletedSample = await deleteMusicSample(id, user.id);

    if (!deletedSample) {
        throw new HTTPException(404, { message: 'Music sample not found' });
    }

    try {
        await deleteR2Object(c.env.ASSETS, deletedSample.r2Key);
    } catch (error) {
        console.error('Failed to delete R2 object:', error);
    }

    return c.body(null, 204);
});

musicSamplesRoutes.patch('/users/music-samples/reorder', async (c) => {
    const user = c.get('user');

    const body = await c.req.json();
    const { orderedIds } = reorderMusicSamplesSchema.parse(body);

    const existingSamples = await getMusicSamplesByUserId(user.id);
    const existingIds = new Set(existingSamples.map((s) => s.id));

    for (const id of orderedIds) {
        if (!existingIds.has(id)) {
            throw new HTTPException(400, { message: 'One or more sample IDs do not belong to the user' });
        }
    }

    if (orderedIds.length !== existingSamples.length) {
        throw new HTTPException(400, { message: 'All samples must be included in the reorder' });
    }

    const reorderedSamples = await reorderMusicSamples(user.id, orderedIds);

    return c.json(reorderedSamples);
});

export { musicSamplesRoutes };
