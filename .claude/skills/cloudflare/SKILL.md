---
name: cloudflare
description: Cloudflare Workers runtime, D1 database, R2 storage, Durable Objects, and Queues configuration and usage patterns. Use this skill when working with wrangler.jsonc, environment bindings, real-time WebSocket features, file uploads, or queue-based processing.
---

# Cloudflare

## Overview

This skill covers Cloudflare Workers primitives used in Sound Connect: Workers runtime configuration, D1 database bindings, R2 object storage, Durable Objects for real-time communication, and Queues for async processing.

## Documentation Lookup

For up-to-date Cloudflare Workers documentation, use Context7:

```
mcp__context7__get-library-docs({
  context7CompatibleLibraryID: "/cloudflare/workers-sdk",
  topic: "d1" | "r2" | "durable-objects" | "queues" | "wrangler"
})
```

## Out of Scope

- Hono routing/middleware patterns -> use **hono** skill
- Database schema design -> use **database-design** skill
- Drizzle ORM queries -> use **database-design** skill

## Worker Configuration (wrangler.jsonc)

### Basic Structure

```jsonc
{
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "sound-connect-api",
    "main": "src/server.ts",
    "compatibility_date": "2025-10-01",
    "compatibility_flags": ["nodejs_compat"],
    "observability": { "enabled": true }
}
```

### D1 Database Binding

```jsonc
{
    "d1_databases": [
        {
            "binding": "DB",
            "database_name": "sound-connect-db",
            "database_id": "6f14b889-a6fb-4565-857d-d841cef75df2",
            "migrations_dir": "../../packages/drizzle/migrations"
        }
    ]
}
```

**Usage in code:**

```typescript
import { drizzle } from 'drizzle-orm/d1';

const db = drizzle(c.env.DB);
const users = await db.select().from(usersTable);
```

### R2 Storage Binding

```jsonc
{
    "r2_buckets": [
        {
            "binding": "ASSETS",
            "bucket_name": "sound-connect-assets"
        }
    ]
}
```

**Public URL:** `https://pub-fe5ef299f3464b73b8c54144ff278eae.r2.dev`

**Usage in code:**

```typescript
await c.env.ASSETS.put(key, fileBody, {
    httpMetadata: { contentType: 'image/jpeg' }
});

const object = await c.env.ASSETS.get(key);
await c.env.ASSETS.delete(key);

const publicUrl = `https://pub-fe5ef299f3464b73b8c54144ff278eae.r2.dev/${key}`;
```

**Folder structure:**

- `temp/` - Temporary uploads (auto-deleted after 24hrs via lifecycle rules)
- `profiles/{userId}/avatar.{ext}` - User profile images
- `bands/{bandId}/avatar.{ext}` - Band profile images
- `posts/{postId}/image-{n}.{ext}` - Post media

### Durable Objects Binding

```jsonc
{
    "durable_objects": {
        "bindings": [
            { "name": "ChatDO", "class_name": "ChatDurableObject" },
            { "name": "UserDO", "class_name": "UserDurableObject" },
            { "name": "NotificationsDO", "class_name": "NotificationsDurableObject" }
        ]
    },
    "migrations": [
        { "tag": "v1", "new_sqlite_classes": ["ChatDurableObject"] },
        { "tag": "v2", "deleted_classes": ["OldClass"], "new_sqlite_classes": ["NewClass"] }
    ]
}
```

**Cross-worker DO binding:**

```jsonc
{
    "durable_objects": {
        "bindings": [
            {
                "name": "NotificationsDO",
                "class_name": "NotificationsDurableObject",
                "script_name": "sound-connect-api"
            }
        ]
    }
}
```

### Queue Bindings

**Producer (API worker):**

```jsonc
{
    "queues": {
        "producers": [
            { "queue": "posts-queue", "binding": "PostsQueue" },
            { "queue": "notifications-queue", "binding": "NotificationsQueue" }
        ]
    }
}
```

**Consumer (queue worker):**

```jsonc
{
    "queues": {
        "consumers": [
            {
                "queue": "posts-queue",
                "max_batch_size": 10,
                "max_batch_timeout": 1,
                "max_retries": 3,
                "dead_letter_queue": "posts-queue-dlq"
            }
        ]
    }
}
```

### Environment-Specific Config

```jsonc
{
    "vars": {
        "API_URL": "http://localhost:4000"
    },
    "env": {
        "production": {
            "vars": {
                "API_URL": "https://sound-connect-api-production.workers.dev"
            }
        }
    }
}
```

### Service Bindings (Worker-to-Worker)

```jsonc
{
    "services": [
        {
            "binding": "API",
            "service": "sound-connect-api"
        }
    ]
}
```

## Environment Bindings Reference

All bindings are accessed via `c.env` (Hono context) or `env` (worker handler):

| Binding | Type | Description |
|---------|------|-------------|
| `DB` | `D1Database` | D1 SQLite database |
| `ASSETS` | `R2Bucket` | R2 object storage |
| `ChatDO` | `DurableObjectNamespace` | Chat room Durable Objects |
| `UserDO` | `DurableObjectNamespace` | Per-user WebSocket Durable Objects |
| `NotificationsDO` | `DurableObjectNamespace` | Notifications Durable Objects |
| `PostsQueue` | `Queue` | Posts moderation queue |
| `NotificationsQueue` | `Queue` | Notifications delivery queue |

## Durable Objects Pattern

### Defining a Durable Object

```typescript
import { DurableObject } from 'cloudflare:workers';

export class ChatDurableObject extends DurableObject {
    private storage: DurableObjectStorage;

    constructor(ctx: DurableObjectState, public override env: Cloudflare.Env) {
        super(ctx, env);
        this.storage = ctx.storage;
    }

    async subscribeUser(userId: string, roomId: string): Promise<void> {
        // Semantic method - NOT fetch()
    }

    async sendMessage(senderId: string, roomId: string, content: string): Promise<void> {
        // Direct method call
    }
}
```

### Calling Durable Objects (Semantic Methods)

**Preferred pattern - use semantic method names:**

```typescript
const id = c.env.ChatDO.idFromName(`room:${roomId}`);
const stub = c.env.ChatDO.get(id);

const history = await stub.getRoomHistory(roomId, userId);
await stub.sendMessage(senderId, roomId, content);
```

### WebSocket Upgrade via Durable Object

**Route handler:**

```typescript
websocketRoutes.on(['GET', 'POST'], '/ws/user', async (c) => {
    const upgradeHeader = c.req.header('Upgrade');

    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        throw new HTTPException(426, { message: 'WebSocket Upgrade Required' });
    }

    const user = c.get('user');
    const id = c.env.UserDO.idFromName(`user:${user.id}`);
    const stub = c.env.UserDO.get(id);

    const modifiedRequest = new Request(c.req.raw, {
        headers: new Headers({
            ...Object.fromEntries(c.req.raw.headers),
            'X-User-Id': user.id
        })
    });

    return stub.fetch(modifiedRequest);
});
```

**Durable Object fetch handler:**

```typescript
override async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    const userId = request.headers.get('X-User-Id');

    if (upgradeHeader?.toLowerCase() === 'websocket') {
        const wsPair = new WebSocketPair();
        const [client, server] = wsPair;

        server.accept();
        this.websocket = server;

        server.addEventListener('message', (event) => { /* handle */ });
        server.addEventListener('close', () => { /* cleanup */ });

        return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Not Found', { status: 404 });
}
```

### Durable Object Storage

```typescript
await this.storage.put('key', value);
const value = await this.storage.get('key');
await this.storage.delete('key');
const all = await this.storage.list();
```

## Queue Pattern

### Sending to Queue (Producer)

```typescript
import { postQueueMessageSchema } from '@sound-connect/common/types/posts';

const queueMessage = postQueueMessageSchema.parse({
    postId: post.id,
    userId: user.id,
    content,
    mediaKeys
});

await c.env.PostsQueue.send(queueMessage);
```

### Processing Queue (Consumer)

```typescript
import { postQueueMessageSchema, type PostQueueMessage } from '@sound-connect/common/types/posts';

export default {
    fetch: app.fetch,
    async queue(batch: MessageBatch<PostQueueMessage>, env: CloudflareBindings): Promise<void> {
        for (const message of batch.messages) {
            try {
                const validated = postQueueMessageSchema.parse(message.body);
                await processPost(validated, env);
                message.ack();
            } catch {
                message.retry();
            }
        }
    }
};
```

## R2 Upload Pattern

### Presigned URL Flow

1. **Request session:** `POST /api/uploads/presigned-url`
2. **Upload file:** `POST /api/uploads/upload?sessionId={id}`
3. **Confirm & move:** `POST /api/uploads/confirm`

```typescript
await c.env.ASSETS.put(session.tempKey, body, {
    httpMetadata: { contentType: session.contentType }
});

const object = await c.env.ASSETS.get(fromKey);
await c.env.ASSETS.put(toKey, object.body, {
    httpMetadata: object.httpMetadata
});
await c.env.ASSETS.delete(fromKey);
```

### Direct Upload (Legacy)

```typescript
const key = crypto.randomUUID();
await c.env.ASSETS.put(key, file);
const publicUrl = `https://pub-fe5ef299f3464b73b8c54144ff278eae.r2.dev/${key}`;
```

## Type Generation

After modifying `wrangler.jsonc`, regenerate types:

```bash
pnpm run types
```

This updates `worker-configuration.d.ts` with the `Cloudflare.Env` interface.

## Worker Apps Overview

| App | Purpose | Bindings |
|-----|---------|----------|
| `apps/api` | Main API, exports DOs | DB, ASSETS, ChatDO, UserDO, NotificationsDO, PostsQueue, NotificationsQueue |
| `apps/web` | Frontend (Tanstack Start) | API (service binding) |
| `apps/posts-queue-consumer` | Post moderation | DB, ASSETS |
| `apps/notifications-queue-consumer` | Notification delivery | DB, NotificationsDO (cross-worker) |

## Common Patterns

### ID Generation for Durable Objects

```typescript
const id = c.env.ChatDO.idFromName(`room:${roomId}`);
const id = c.env.UserDO.idFromName(`user:${userId}`);
const id = c.env.NotificationsDO.idFromName('notifications:global');
```

### Cross-Worker Durable Object Access

When a queue consumer needs to access a DO defined in another worker, use `script_name`:

```jsonc
{
    "durable_objects": {
        "bindings": [{
            "name": "NotificationsDO",
            "class_name": "NotificationsDurableObject",
            "script_name": "sound-connect-api-production"
        }]
    }
}
```

### Exporting Durable Objects

Durable Objects must be exported from the main worker entry:

```typescript
export { ChatDurableObject, UserDurableObject, NotificationsDurableObject } from '@sound-connect/durable-objects';

export default app;
```
