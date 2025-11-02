import { Hono } from 'hono';
import { HonoContext } from './types';
import { processPost } from './services/moderation-service';
import { postQueueMessageSchema, type PostQueueMessage } from '@sound-connect/common/types/posts';

const app = new Hono<HonoContext>();

app.onError(({ name, message, stack, cause }, c) => {
    return c.json({ name, message, stack, cause }, 400);
});

app.notFound((c) => {
    return c.text('Not Found', 404);
});

app.get('/health', (c) => {
    return c.body('OK', 200);
});

export default {
    fetch: app.fetch,
    async queue(batch: MessageBatch<PostQueueMessage>, env: CloudflareBindings): Promise<void> {
        console.log(`Processing batch of ${batch.messages.length} posts`);

        for (const message of batch.messages) {
            try {
                const validatedMessage = postQueueMessageSchema.parse(message.body);
                await processPost(validatedMessage, env);
                message.ack();
                console.log(`Successfully processed post with ID: ${message.body.postId}`);
            } catch (error) {
                console.error(`Failed to process post with ID: ${message.body.postId}:`, error);
                message.retry();
            }
        }
    }
};
