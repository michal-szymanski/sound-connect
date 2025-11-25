---
name: hono
description: Build REST API routes with Hono framework. Use when creating, modifying, or debugging API endpoints in apps/api. Covers route handlers, middleware, request validation with Zod, error handling with HTTPException, and response patterns.
---

# Hono API Development

Build type-safe REST API routes for Cloudflare Workers using Hono framework with Zod validation.

## Context7 Integration

For up-to-date Hono documentation, use the Context7 MCP tool:

```
mcp__context7__get-library-docs
context7CompatibleLibraryID: "/honojs/hono"
topic: "<relevant-topic>"
```

Topics: "routing", "context", "middleware", "validation", "error-handling"

## Project Structure

```
apps/api/src/
  server.ts           # Main app, route mounting, error handlers
  middlewares.ts      # Auth middleware (sets c.get('user'))
  routes/             # Route modules (one per resource)
    users.ts
    posts.ts
    bands.ts
    ...
  types.ts            # HonoContext type definition
```

## HonoContext Type

All routes use the shared context type from `apps/api/types.ts`:

```typescript
import { Hono } from 'hono';
import { HonoContext } from 'types';

const routes = new Hono<HonoContext>();
```

The context provides:
- `c.env` - Cloudflare bindings (DB, queues, R2, Durable Objects)
- `c.get('user')` - Authenticated user (set by auth middleware)

## Route Handler Patterns

### GET - Fetch Resource

```typescript
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { HonoContext } from 'types';

const routes = new Hono<HonoContext>();

routes.get('/users/:userId', async (c) => {
    const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
    const currentUser = c.get('user');

    const user = await getUserById(userId);

    if (!user) {
        throw new HTTPException(404, { message: 'User not found' });
    }

    return c.json(user);
});
```

### GET - List with Query Params

```typescript
routes.get('/feed', async (c) => {
    const { limit, offset } = z
        .object({
            limit: z.coerce.number().positive().max(50).optional().default(10),
            offset: z.coerce.number().min(0).optional().default(0)
        })
        .parse({
            limit: c.req.query('limit'),
            offset: c.req.query('offset')
        });

    const user = c.get('user');
    const results = await getFeed(limit, offset, user?.id);

    return c.json(results, 200);
});
```

### GET - Array Query Params

```typescript
routes.get('/users/search', async (c) => {
    const query = c.req.query();

    const rawParams = {
        instruments: query['instruments[]']
            ? (Array.isArray(query['instruments[]'])
                ? query['instruments[]']
                : [query['instruments[]']])
            : undefined,
        page: query['page'],
        limit: query['limit']
    };

    const params = searchParamsSchema.parse(rawParams);
    const results = await searchProfiles(params);

    return c.json({ results: results.data, pagination: results.pagination });
});
```

### POST - Create Resource (JSON Body)

```typescript
routes.post('/bands', async (c) => {
    const user = c.get('user');

    const body = await c.req.json();
    const data = createBandInputSchema.parse(body);

    const band = await createBand(data, user.id);

    return c.json(band, 201);
});
```

### POST - Create Resource (FormData)

```typescript
routes.post('/posts', async (c) => {
    const form = await c.req.formData();

    const { content, media } = z
        .object({
            content: z.string(),
            media: z.array(z.instanceof(File)).optional()
        })
        .parse({
            content: form.get('content'),
            media: form.getAll('media')
        });

    const user = c.get('user');
    const post = await addPost(user.id, content);

    return c.json({ post, media: [] });
});
```

### PATCH - Update Resource

```typescript
routes.patch('/bands/:id', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());
    const user = c.get('user');

    const isAdmin = await isBandAdmin(id, user.id);
    if (!isAdmin) {
        throw new HTTPException(403, { message: 'Not authorized to edit this band' });
    }

    const body = await c.req.json();
    const data = updateBandInputSchema.parse(body);

    const updatedBand = await updateBand(id, data);

    return c.json(updatedBand);
});
```

### DELETE - Remove Resource

```typescript
routes.delete('/bands/:id', async (c) => {
    const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());
    const user = c.get('user');

    const isAdmin = await isBandAdmin(id, user.id);
    if (!isAdmin) {
        throw new HTTPException(403, { message: 'Not authorized to delete this band' });
    }

    await deleteBand(id);

    return c.body(null, 204);
});
```

## Authentication

Global auth middleware at `middlewares.ts` handles authentication:

```typescript
export const authMiddleware = async (c: Context<HonoContext>, next: Next) => {
    // Public routes bypass auth
    if (c.req.path.startsWith('/api/auth/') || c.req.path === '/health') {
        return next();
    }

    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
        return c.json({ message: 'Unauthorized' }, 401);
    }

    c.set('user', session.user);
    return next();
};
```

**Critical Rule**: Always use `c.get('user')` for the current user ID. Never trust user IDs from request body/params for ownership checks.

```typescript
// Correct - use authenticated user
const user = c.get('user');
await likePost(user.id, postId);

// Wrong - never trust frontend
const { userId } = await c.req.json();
await likePost(userId, postId); // Security vulnerability!
```

## Request Validation with Zod

Validate all inputs: params, query, body, formData.

### Path Params

```typescript
const { id } = z.object({ id: z.coerce.number().positive() }).parse(c.req.param());
const { userId } = z.object({ userId: z.string() }).parse(c.req.param());
const { bandId, applicationId } = z.object({
    bandId: z.coerce.number().positive(),
    applicationId: z.coerce.number().positive()
}).parse(c.req.param());
```

### Query Params

```typescript
const { page = 1, limit = 20 } = z
    .object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(50).default(20)
    })
    .parse({
        page: c.req.query('page'),
        limit: c.req.query('limit')
    });
```

### JSON Body

```typescript
const body = await c.req.json();
const data = createBandInputSchema.parse(body);
```

### FormData

```typescript
const form = await c.req.formData();
const { content } = z.object({ content: z.string() }).parse({
    content: form.get('content')
});
```

## Error Handling

Use `HTTPException` for all API errors:

```typescript
import { HTTPException } from 'hono/http-exception';

// 400 Bad Request
throw new HTTPException(400, { message: 'Invalid input' });

// 401 Unauthorized
throw new HTTPException(401, { message: 'Unauthorized' });

// 403 Forbidden
throw new HTTPException(403, { message: 'Not authorized to perform this action' });

// 404 Not Found
throw new HTTPException(404, { message: 'Resource not found' });

// 409 Conflict
throw new HTTPException(409, { message: 'Resource already exists' });

// 500 Internal Server Error
throw new HTTPException(500, { message: 'Failed to process request' });
```

Global error handler in `server.ts`:

```typescript
app.onError((error, c) => {
    console.error(error);
    if (error instanceof HTTPException) {
        return error.getResponse();
    }
    return c.text('Internal Server Error', 500);
});

app.notFound((c) => {
    return c.text('Not Found', 404);
});
```

## Response Patterns

```typescript
// JSON response (default 200)
return c.json(data);

// JSON with specific status
return c.json(band, 201);

// Empty response (204 No Content)
return c.body(null, 204);

// Plain text response
return c.body('OK', 200);
return c.text('Not Found', 404);

// Validated response
return c.json(responseSchema.parse(result));
```

## Route Organization

Each resource gets its own file in `routes/`:

```typescript
// routes/bands.ts
import { Hono } from 'hono';
import { HonoContext } from 'types';

const bandsRoutes = new Hono<HonoContext>();

bandsRoutes.get('/bands/search', async (c) => { ... });
bandsRoutes.post('/bands', async (c) => { ... });
bandsRoutes.get('/bands/:id', async (c) => { ... });
bandsRoutes.patch('/bands/:id', async (c) => { ... });
bandsRoutes.delete('/bands/:id', async (c) => { ... });
bandsRoutes.post('/bands/:id/members', async (c) => { ... });

export { bandsRoutes };
```

Mount routes in `server.ts`:

```typescript
import { bandsRoutes } from './routes/bands';

const app = new Hono<HonoContext>();
app.use('*', authMiddleware);
app.route('/api', bandsRoutes);
```

## Common Patterns

### Authorization Checks

```typescript
const isAdmin = await isBandAdmin(bandId, user.id);
if (!isAdmin) {
    throw new HTTPException(403, { message: 'Only band admins can perform this action' });
}
```

### Existence Checks

```typescript
const band = await getBandById(id);
if (!band) {
    throw new HTTPException(404, { message: 'Band not found' });
}
```

### Queue Messages

```typescript
const queueMessage = notificationQueueMessageSchema.parse({
    userId: targetUserId,
    type: 'follow_request',
    actorId: user.id,
    content: `${user.name} started following you`
});

await c.env.NotificationsQueue.send(queueMessage);
```

## Not In Scope

- **Cloudflare bindings** (D1, R2, Durable Objects) - See cloudflare skill
- **Database queries** (Drizzle ORM) - See database-design skill
- **Frontend API calls** (Tanstack Query) - See tanstack skill
