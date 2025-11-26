import { schema } from '@/drizzle';
import { eq } from 'drizzle-orm';
import { db } from '../index';

const { mediaTable } = schema;

export async function getMediaByPostId(postId: number) {
    return db.select().from(mediaTable).where(eq(mediaTable.postId, postId));
}

export async function updateMediaKey(mediaId: number, newKey: string): Promise<void> {
    await db.update(mediaTable).set({ key: newKey }).where(eq(mediaTable.id, mediaId));
}
