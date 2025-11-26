import { PostStatus } from '@/common/types/models';
import { ModerationResult } from '../types';
import { updatePostStatus } from '@/posts-queue-consumer/db/queries/posts-queries';
import { getMediaByPostId, updateMediaKey } from '@/posts-queue-consumer/db/queries/media-queries';
import { moveR2Object } from './r2-service';
import type { PostQueueMessage } from '@sound-connect/common/types/posts';

export async function processPost(postData: PostQueueMessage, env: CloudflareBindings): Promise<void> {
    console.log(`Processing post ${postData.postId} by user ${postData.userId}`);

    try {
        const moderationResult = await moderatePost(postData);

        await updatePostStatus(postData.postId, moderationResult['status'], moderationResult['reason']);

        if (moderationResult['status'] === 'approved' && postData.mediaKeys && postData.mediaKeys.length > 0) {
            await moveMediaToPermanentLocation(postData.postId, env.ASSETS);
        }

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

async function moveMediaToPermanentLocation(postId: number, assetsBucket: R2Bucket): Promise<void> {
    const mediaRecords = await getMediaByPostId(postId);

    for (let i = 0; i < mediaRecords.length; i++) {
        const media = mediaRecords[i];

        if (!media) {
            console.error(`Media record at index ${i} is undefined for post ${postId}`);
            continue;
        }

        const extension = media.key.split('.').pop();
        const permanentKey = `posts/${postId}/media-${i + 1}.${extension}`;

        try {
            await moveR2Object(assetsBucket, media.key, permanentKey);
            await updateMediaKey(media.id, permanentKey);

            console.log(`Moved media ${media.id} from ${media.key} to ${permanentKey}`);
        } catch (error) {
            console.error(`Failed to move media ${media.id}:`, error);
            throw error;
        }
    }
}
