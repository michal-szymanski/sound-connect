import { PostStatus } from '@sound-connect/common/types/models';
import { schema } from '@sound-connect/drizzle';
import { eq } from 'drizzle-orm';
import { db } from '../index';

const { postsTable } = schema;

export async function updatePostStatus(postId: number, status: PostStatus, reason?: string): Promise<void> {
    try {
        await db
            .update(postsTable)
            .set({
                status,
                moderationReason: reason,
                moderatedAt: new Date().toISOString()
            })
            .where(eq(postsTable.id, postId));

        console.log(`Updated post ${postId} status to: ${status}`);
    } catch (error) {
        console.error(`Failed to update post ${postId} status:`, error);
        throw error;
    }
}
