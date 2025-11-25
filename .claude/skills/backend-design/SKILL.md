---
name: backend-design
description: |
  Backend architecture patterns for Sound Connect APIs. Use when designing API routes,
  organizing business logic, implementing authorization patterns, structuring backend code,
  or making architectural decisions about service layers, error handling, and async processing.
  Triggers: "API design", "route structure", "authorization", "backend architecture",
  "business logic", "service layer", "queue processing", "error handling patterns".
---

# Backend Design

Backend architecture patterns and conventions for building maintainable, secure, and scalable APIs in Sound Connect.

## Core Principles

1. **Security First** - Authorization checks on every resource access
2. **Type Safety** - Zod validation at API boundaries
3. **Consistency** - Uniform patterns across all endpoints
4. **Performance** - Optimize for D1/SQLite characteristics
5. **Maintainability** - Clear organization and separation of concerns

## API Design Conventions

### URL Structure

Follow RESTful resource naming:

```
GET    /api/users/:id              # Get single resource
GET    /api/users                  # List resources (paginated)
POST   /api/users                  # Create resource
PATCH  /api/users/:id              # Update resource (partial)
PUT    /api/users/:id              # Replace resource (full)
DELETE /api/users/:id              # Delete resource

# Nested resources
GET    /api/users/:userId/posts    # User's posts
POST   /api/bands/:bandId/members  # Add member to band

# Actions (use sparingly)
POST   /api/bands/:id/apply        # Apply to band
POST   /api/posts/:id/publish      # Publish draft
```

**Rules:**
- Use plural nouns for resources (`/users`, `/posts`, `/bands`)
- Use kebab-case for multi-word resources (`/follow-requests`)
- Avoid verbs in URLs except for non-CRUD actions
- Keep nesting to 2 levels maximum
- Use query params for filtering/pagination, not URL path

### Response Format

**Success responses:**

```typescript
// Single resource
return c.json({ id: '123', name: 'John' }, 200);

// List with pagination
return c.json({
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
    hasMore: true
  }
}, 200);

// Creation
return c.json({ id: '123', ... }, 201);

// No content
return c.body(null, 204);
```

**Error responses:**

```typescript
throw new HTTPException(400, {
  message: 'Invalid input'
});

throw new HTTPException(404, {
  message: 'User not found'
});

throw new HTTPException(403, {
  message: 'Not authorized to access this resource'
});
```

**Status code usage:**
- `200` - Success with body
- `201` - Resource created
- `204` - Success, no body (deletes, some updates)
- `400` - Invalid input (validation failure)
- `401` - Not authenticated (no session)
- `403` - Not authorized (lacks permission)
- `404` - Resource not found
- `409` - Conflict (duplicate, constraint violation)
- `500` - Server error (unexpected)

### Pagination

Always paginate list endpoints:

```typescript
const page = Number(c.req.query('page')) || 1;
const limit = Number(c.req.query('limit')) || 20;
const offset = (page - 1) * limit;

const items = await db
  .select()
  .from(posts)
  .limit(limit + 1)  // Fetch one extra to check hasMore
  .offset(offset);

const hasMore = items.length > limit;
const data = items.slice(0, limit);

return c.json({
  data,
  pagination: { page, limit, hasMore }
});
```

**Rules:**
- Default limit: 20
- Max limit: 100 (enforce server-side)
- Use offset pagination (simpler for D1)
- Include `hasMore` flag (cheaper than COUNT)
- Sort by indexed column + id for stability

## Code Organization

### File Structure

```
apps/api/src/
├── server.ts                    # Main Hono app, route mounting
├── middlewares.ts              # Auth, CORS, error handling
├── types.ts                    # HonoContext type
├── routes/                     # API route handlers
│   ├── auth.ts                 # /api/auth/*
│   ├── users.ts                # /api/users/*
│   ├── posts.ts                # /api/posts/*
│   └── bands/                  # /api/bands/* (complex resource)
│       ├── index.ts            # Band CRUD
│       ├── members.ts          # /api/bands/:id/members
│       └── applications.ts     # /api/bands/:id/applications
├── db/
│   ├── queries/               # Database query functions
│   │   ├── users-queries.ts
│   │   ├── posts-queries.ts
│   │   └── bands-queries.ts
│   └── helpers/               # Query utilities
│       ├── pagination.ts
│       └── filters.ts
├── services/                  # Business logic (complex operations)
│   ├── band-application-service.ts
│   └── notification-service.ts
└── utils/                     # Shared utilities
    ├── validation.ts
    └── auth-helpers.ts
```

### When to Split Files

**Single file** (`routes/users.ts`):
- Simple CRUD (< 200 lines)
- 5-10 endpoints
- Minimal business logic

**Directory** (`routes/bands/`):
- Complex resource (> 200 lines)
- 10+ endpoints
- Multiple sub-resources
- Significant business logic

### Query Organization

Keep database queries in `db/queries/` separate from route handlers:

```typescript
// db/queries/posts-queries.ts
export async function getPostById(db: DrizzleD1Database, postId: string) {
  return db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .get();
}

export async function createPost(db: DrizzleD1Database, data: InsertPost) {
  return db
    .insert(posts)
    .values(data)
    .returning()
    .get();
}

// routes/posts.ts
import { getPostById, createPost } from '../db/queries/posts-queries';

app.get('/:id', async (c) => {
  const post = await getPostById(c.env.DB, c.req.param('id'));
  // ...
});
```

**Benefits:**
- Testable query logic
- Reusable across routes
- Clear separation of concerns
- Type inference from Drizzle

## Service Layer Patterns

### When to Use Services

Use service layer for:
- Multi-step business logic
- Multiple database operations (transactions)
- Complex authorization rules
- Cross-resource coordination
- Queue message sending
- External API calls

**Simple CRUD** - Keep in route handler:

```typescript
app.post('/users', async (c) => {
  const data = await c.req.json();
  const user = await createUser(c.env.DB, data);
  return c.json(user, 201);
});
```

**Complex logic** - Extract to service:

```typescript
// services/band-application-service.ts
export async function acceptBandApplication(
  db: DrizzleD1Database,
  queue: Queue,
  applicationId: string,
  acceptedBy: string
) {
  // 1. Get application
  const app = await getApplicationById(db, applicationId);
  if (!app) throw new HTTPException(404);

  // 2. Verify acceptor is band admin
  await verifyBandAdmin(db, app.bandId, acceptedBy);

  // 3. Add applicant as band member
  await addBandMember(db, app.bandId, app.userId);

  // 4. Update application status
  await updateApplication(db, applicationId, 'accepted');

  // 5. Queue notification
  await queue.send({
    type: 'band_application_accepted',
    userId: app.userId,
    bandId: app.bandId
  });

  return app;
}

// routes/bands/applications.ts
app.post('/:id/accept', async (c) => {
  const currentUser = c.get('user');
  const app = await acceptBandApplication(
    c.env.DB,
    c.env.NOTIFICATIONS_QUEUE,
    c.req.param('id'),
    currentUser.id
  );
  return c.json(app);
});
```

**Service pattern benefits:**
- All business logic in one place
- Easier to test (pass in dependencies)
- Clearer error handling
- Reusable across endpoints

## Authorization Patterns

### Basic Authentication

**NEVER trust user ID from request body:**

```typescript
// DANGEROUS - Attacker can change userId in request
const { userId, content } = await c.req.json();
await createPost(db, { userId, content });

// CORRECT - Always from session
const currentUser = c.get('user');
await createPost(db, { userId: currentUser.id, content });
```

### Resource Ownership

Check ownership before read/write:

```typescript
app.patch('/posts/:id', async (c) => {
  const currentUser = c.get('user');
  const postId = c.req.param('id');

  const post = await getPostById(c.env.DB, postId);
  if (!post) {
    throw new HTTPException(404, { message: 'Post not found' });
  }

  // Ownership check
  if (post.userId !== currentUser.id) {
    throw new HTTPException(403, { message: 'Not authorized' });
  }

  // Proceed with update
  const data = await c.req.json();
  const updated = await updatePost(c.env.DB, postId, data);
  return c.json(updated);
});
```

### Role-Based Access Control

For resources with roles (e.g., bands):

```typescript
// utils/auth-helpers.ts
export async function verifyBandAdmin(
  db: DrizzleD1Database,
  bandId: string,
  userId: string
) {
  const member = await db
    .select()
    .from(bandMembers)
    .where(
      and(
        eq(bandMembers.bandId, bandId),
        eq(bandMembers.userId, userId),
        eq(bandMembers.isAdmin, true)
      )
    )
    .get();

  if (!member) {
    throw new HTTPException(403, { message: 'Admin access required' });
  }
}

// routes/bands/members.ts
app.delete('/:bandId/members/:userId', async (c) => {
  const currentUser = c.get('user');

  // Verify admin before allowing member removal
  await verifyBandAdmin(c.env.DB, c.req.param('bandId'), currentUser.id);

  await removeBandMember(c.env.DB, c.req.param('bandId'), c.req.param('userId'));
  return c.body(null, 204);
});
```

**Authorization helper patterns:**
- `verifyOwnership(resourceId, userId)` - Resource belongs to user
- `verifyBandAdmin(bandId, userId)` - User is band admin
- `verifyBandMember(bandId, userId)` - User is band member
- `canMessageUser(fromUserId, toUserId)` - Respects privacy settings

### Privacy Settings

Respect user privacy preferences:

```typescript
// db/queries/users-queries.ts
export async function canViewProfile(
  db: DrizzleD1Database,
  profileUserId: string,
  viewerUserId: string | null
) {
  const user = await getUserById(db, profileUserId);
  if (!user) return false;

  // Public profiles - anyone can view
  if (user.profileVisibility === 'public') return true;

  // Not logged in - can't view non-public
  if (!viewerUserId) return false;

  // Own profile - always can view
  if (profileUserId === viewerUserId) return true;

  // Followers only - check follow relationship
  if (user.profileVisibility === 'followers_only') {
    return await isFollowing(db, viewerUserId, profileUserId);
  }

  // Private - no one can view
  return false;
}
```

## Error Handling Standards

### Validation Errors

Always validate input with Zod at API boundaries:

```typescript
import { z } from 'zod';

const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaKeys: z.array(z.string()).max(5).optional()
});

app.post('/posts', async (c) => {
  const body = await c.req.json();

  // Validate with Zod
  const result = createPostSchema.safeParse(body);
  if (!result.success) {
    throw new HTTPException(400, {
      message: 'Invalid input',
      cause: result.error
    });
  }

  const post = await createPost(c.env.DB, {
    ...result.data,
    userId: c.get('user').id
  });

  return c.json(post, 201);
});
```

### Database Errors

Handle unique constraint violations:

```typescript
try {
  await createUser(db, data);
} catch (error) {
  if (error.message.includes('UNIQUE constraint')) {
    throw new HTTPException(409, { message: 'Email already exists' });
  }
  throw error;  // Re-throw unexpected errors
}
```

### Centralized Error Handling

Use Hono error handler middleware:

```typescript
// middlewares.ts
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  console.error('Unexpected error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});
```

## Queue Processing Guidelines

### When to Use Queues

Use async queue processing for:
- **Non-critical operations** - Notifications, emails, analytics
- **Time-consuming tasks** - Image processing, content moderation
- **Retry-able operations** - External API calls
- **High-volume events** - Batch operations

Keep synchronous for:
- **Critical path operations** - User login, post creation
- **Immediate feedback required** - Validation, authorization checks
- **Transactional consistency needed** - Payment processing

### Message Design

Keep messages simple and serializable:

```typescript
// GOOD - Simple, typed message
type NotificationMessage = {
  type: 'follow_request' | 'post_comment' | 'band_application';
  userId: string;
  actorId: string;
  resourceId: string;
  metadata?: Record<string, string>;
};

await queue.send({
  type: 'follow_request',
  userId: targetUserId,
  actorId: currentUser.id,
  resourceId: requestId
});

// BAD - Complex objects, functions, circular refs
await queue.send({
  user: fullUserObject,  // May have circular refs
  callback: () => {},     // Not serializable
  timestamp: new Date()   // Use ISO string instead
});
```

**Message design rules:**
- Use discriminated unions (`type` field)
- Only include IDs, not full objects
- Use ISO strings for dates
- Keep metadata flat and simple
- Version messages if schema might change

### Consumer Patterns

```typescript
// apps/notifications-queue-consumer/src/index.ts
export default {
  async queue(batch: MessageBatch, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        const data = message.body as NotificationMessage;

        // Process based on type
        switch (data.type) {
          case 'follow_request':
            await handleFollowRequest(env.DB, data);
            break;
          case 'post_comment':
            await handlePostComment(env.DB, data);
            break;
          case 'band_application':
            await handleBandApplication(env.DB, data);
            break;
        }

        message.ack();
      } catch (error) {
        console.error('Message processing failed:', error);
        message.retry();  // Will retry with exponential backoff
      }
    }
  }
};
```

**Consumer rules:**
- Always `ack()` successfully processed messages
- Use `retry()` for transient failures
- Log errors for debugging
- Validate message schema with Zod
- Keep processing idempotent (handle duplicate messages)

## Cross-Cutting Concerns

### Logging

Use structured logging for observability:

```typescript
console.log(JSON.stringify({
  level: 'info',
  endpoint: '/api/posts',
  userId: currentUser.id,
  duration: Date.now() - startTime,
  status: 200
}));
```

### Rate Limiting

Implement at middleware level (future):

```typescript
// Placeholder - not yet implemented
// Consider Cloudflare Workers rate limiting API
```

### Caching

Use R2 for static assets, D1 query optimization for data:

```typescript
// Cache user profile images in R2
const key = `profiles/${userId}/avatar.jpg`;
await env.ASSETS.put(key, file);

// Optimize queries instead of in-memory caching
// D1 is already cached by Cloudflare
```

## Testing Considerations

Refer to `test-expert` agent for:
- Unit testing query functions
- Integration testing API routes
- Mocking Cloudflare bindings
- E2E testing with Playwright

## Context7 Integration

For up-to-date documentation on backend technologies:

```typescript
// Use context7 MCP for latest docs:
// - Hono framework patterns
// - Cloudflare Workers/D1/Queues
// - Drizzle ORM queries
// - better-auth session handling
```
