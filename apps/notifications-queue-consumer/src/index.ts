import { Hono } from 'hono';
import { processNotification } from './services/notification-service';
import { notificationQueueMessageSchema, type NotificationQueueMessage } from '@sound-connect/common/types/notifications';

const app = new Hono();

app.get('/health', (c) => {
    return c.json({ status: 'healthy', service: 'notifications-queue-consumer' });
});

export default {
    fetch: app.fetch,
    async queue(batch: MessageBatch<NotificationQueueMessage>, env: CloudflareBindings): Promise<void> {
        console.log(`Processing batch of ${batch.messages.length} notifications`);

        for (const message of batch.messages) {
            try {
                const validatedMessage = notificationQueueMessageSchema.parse(message.body);
                await processNotification(validatedMessage, env);
                message.ack();
                console.log(`Successfully processed notification for user: ${message.body.userId}`);
            } catch (error) {
                console.error(`Failed to process notification for user: ${message.body.userId}`, error);
                message.retry();
            }
        }
    }
};
