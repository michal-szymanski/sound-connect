import { PostStatus } from '@sound-connect/common/types/models';
import { PostQueueMessage, ModerationResult } from '../types';
import { updatePostStatus } from '@/posts-queue-consumer/db/queries/posts-queries';

export async function processPost(postData: PostQueueMessage, _env: CloudflareBindings): Promise<void> {
    console.log(`Processing post ${postData.postId} by user ${postData.userId}`);

    try {
        const moderationResult = await moderatePost(postData);

        await updatePostStatus(postData.postId, moderationResult['status'], moderationResult['reason']);

        console.log(`Post ${postData.postId} moderation complete: ${moderationResult['status']}`);
    } catch (error) {
        console.error(`Error processing post ${postData.postId}:`, error);

        await updatePostStatus(postData.postId, 'rejected', 'Processing error');
        throw error;
    }
}

async function moderatePost(postData: PostQueueMessage): Promise<ModerationResult> {
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
        const mediaModeration = await moderateMedia(postData.mediaKeys);
        if (mediaModeration['status'] !== 'approved') {
            return mediaModeration;
        }
    }

    return moderationResult;
}

async function containsOffensiveContent(content: string): Promise<boolean> {
    const bannedWords = ['spam', 'scam', 'offensive'];

    const lowercaseContent = content.toLowerCase();
    return bannedWords.some((word) => lowercaseContent.includes(word));
}

async function moderateMedia(mediaKeys: string[]): Promise<ModerationResult> {
    for (const mediaKey of mediaKeys) {
        console.log(`Checking media: ${mediaKey}`);
    }

    return {
        status: 'approved' as PostStatus,
        confidence: 1.0
    };
}
