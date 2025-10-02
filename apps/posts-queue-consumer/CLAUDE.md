# Posts Queue Consumer Worker

This worker is responsible for processing posts from the Cloudflare Queue and performing content moderation.

📚 **[← Back to Main Documentation](../../CLAUDE.md)**

## Technology Stack
- **Runtime**: Cloudflare Workers
- **Queue**: Cloudflare Queues for message consumption
- **Database**: Drizzle.js ORM with D1 database

## Functionality
- Consumes posts from the `posts-queue`
- Performs content moderation on text and media
- Updates post status in the database
- Handles retries and dead letter queues

## Queue Configuration
- **Max batch size**: 10 messages
- **Max batch timeout**: 30 seconds
- **Max retries**: 3
- **Dead letter queue**: posts-queue-dlq

## Post Processing Flow
1. Receive post message from queue
2. Validate text content for offensive language
3. Check media content (if present)
4. Update post status in database
5. Acknowledge or retry message

## Post Statuses
- `pending`: Initial status when post is created
- `approved`: Post passed moderation
- `rejected`: Post failed moderation
- `flagged`: Post requires manual review

## Development Rules
- Always handle errors gracefully to prevent message loss
- Log all moderation decisions for audit purposes
- Use structured logging for better observability
- Follow the same coding rules as the main project