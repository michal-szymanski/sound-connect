import { Hono } from 'hono';
import { PostQueueMessage, HonoContext } from './types';
import { processPost } from './services/moderation-service';

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
                await processPost(message.body, env);
                message.ack();
                console.log(`Successfully processed post ${message.body.postId}`);
            } catch (error) {
                console.error(`Failed to process post ${message.body.postId}:`, error);
                message.retry();
            }
        }
    }
};
