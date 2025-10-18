import { PostStatus } from '@sound-connect/common/types/models';
import { PostQueueMessage, ModerationResult } from '../types';
import { db } from '../db';
import { postsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function processPost(postData: PostQueueMessage, env: CloudflareBindings): Promise<void> {
    console.log(`Processing post ${postData.postId} by user ${postData.userId}`);

    try {
        const moderationResult = await moderatePost(postData, env);

        await updatePostStatus(postData.postId, moderationResult['status'], moderationResult['reason'], env);

        console.log(`Post ${postData.postId} moderation complete: ${moderationResult['status']}`);
    } catch (error) {
        console.error(`Error processing post ${postData.postId}:`, error);

        await updatePostStatus(postData.postId, 'rejected', 'Processing error', env);
        throw error;
    }
}

export async function moderatePost(postData: PostQueueMessage, env: CloudflareBindings): Promise<ModerationResult> {
    const moderationResult: ModerationResult = {
        status: 'approved' as PostStatus,
        confidence: 1.0
    };

    if (await containsOffensiveContent(postData.content)) {
        moderationResult['status'] = 'rejected';
        moderationResult['reason'] = 'Contains offensive language';
        moderationResult['confidence'] = 0.9;
        return moderationResult;
    }

    if (postData.mediaKeys && postData.mediaKeys.length > 0) {
        const mediaModeration = await moderateMedia(postData.mediaKeys, env);
        if (mediaModeration['status'] !== 'approved') {
            return mediaModeration;
        }
    }

    return moderationResult;
}

export async function containsOffensiveContent(content: string): Promise<boolean> {
    const bannedWords = ['spam', 'scam', 'offensive'];

    const lowercaseContent = content.toLowerCase();
    return bannedWords.some((word) => lowercaseContent.includes(word));
}

export async function moderateMedia(mediaKeys: string[]): Promise<ModerationResult> {
    for (const mediaKey of mediaKeys) {
        console.log(`Checking media: ${mediaKey}`);
    }

    return {
        status: 'approved' as PostStatus,
        confidence: 1.0
    };
}

export async function updatePostStatus(postId: number, status: PostStatus, reason?: string, env?: CloudflareBindings): Promise<void> {
    try {
        await db(env)
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
