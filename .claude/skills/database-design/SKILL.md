---
name: database-design
description: Drizzle ORM schema design and database operations for SQLite/D1. Use when creating tables, defining relations, writing queries, or managing migrations in packages/drizzle.
---

# Database Design

Design and implement database schemas using Drizzle ORM with SQLite (Cloudflare D1). For current docs, use Context7: `mcp__context7__get-library-docs` with `/drizzle-team/drizzle-orm`.

## Schema Location

- **Schema definitions**: `packages/drizzle/src/schema.ts`
- **Auth tables (better-auth)**: `packages/drizzle/src/better-auth.ts`
- **Migrations**: `packages/drizzle/migrations/`
- **Zod schemas**: `packages/common/src/types/drizzle.ts`
- **Enums**: `packages/common/src/types/profile-enums.ts`

## Table Definition

```typescript
import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';

export const postsTable = sqliteTable(
    'posts',
    {
        id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
        userId: text('user_id').notNull(),
        content: text('content').notNull(),
        status: text('status').default('pending').notNull(),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at')
    },
    (table) => ({
        userIdIdx: index('idx_posts_user_id').on(table.userId),
        statusCreatedIdx: index('idx_posts_status_created').on(table.status, table.createdAt)
    })
);
```

### Column Naming

- **Database columns**: `snake_case` - e.g., `user_id`, `created_at`
- **TypeScript properties**: `camelCase` - e.g., `userId`, `createdAt`
- Always specify explicit column names: `text('column_name')`

### Column Types

```typescript
// Numeric
id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true })
count: integer('count', { mode: 'number' })
isActive: integer('is_active', { mode: 'boolean' })

// Text
name: text('name').notNull()
status: text('status', { enum: statusEnum }).default('pending').notNull()

// Dates - AUTH tables (better-auth expects Date objects)
createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull()

// Dates - APP tables (use ISO strings for JSON serialization)
createdAt: text('created_at').notNull()

// Primary key (text)
id: text('id').primaryKey()
```

### Foreign Keys

```typescript
// Cascade delete (parent deleted -> children deleted)
bandId: integer('band_id')
    .notNull()
    .references(() => bandsTable.id, { onDelete: 'cascade' })

// Set null (parent deleted -> reference becomes null)
senderId: text('sender_id')
    .references(() => users.id, { onDelete: 'set null' })

// Self-referencing (use @ts-expect-error)
// @ts-expect-error - Self-referencing foreign key
parentCommentId: integer('parent_comment_id')
    .references(() => commentsTable.id)
```

### Indexes

Naming convention: `idx_{table}_{columns}`

```typescript
(table) => ({
    userIdIdx: index('idx_posts_user_id').on(table.userId),
    compositeIdx: index('idx_posts_status_created').on(table.status, table.createdAt),
    locationIdx: index('idx_bands_location').on(table.latitude, table.longitude)
})
```

### Composite Primary Key

```typescript
import { primaryKey } from 'drizzle-orm/sqlite-core';

export const chatRoomParticipantsTable = sqliteTable(
    'chat_room_participants',
    {
        chatRoomId: text('chat_room_id').notNull(),
        userId: text('user_id').notNull()
    },
    (table) => ({
        pk: primaryKey({ columns: [table.chatRoomId, table.userId] })
    })
);
```

### Unique Constraints

```typescript
userId: text('user_id').notNull().unique()
```

## Enum Pattern

Define in `packages/common/src/types/profile-enums.ts`:

```typescript
export const StatusEnum = ['pending', 'approved', 'rejected'] as const;
export type Status = (typeof StatusEnum)[number];
```

Use in schema:

```typescript
import { StatusEnum } from '@sound-connect/common/types/profile-enums';

status: text('status', { enum: StatusEnum }).notNull()
```

Create matching Zod schema in `packages/common/src/types/drizzle.ts`:

```typescript
export const statusEnum = z.enum(['pending', 'approved', 'rejected']);
```

## Relations

Define separately from table definitions:

```typescript
import { relations } from 'drizzle-orm';

export const postsRelations = relations(postsTable, ({ one, many }) => ({
    author: one(users, { fields: [postsTable.userId], references: [users.id] }),
    comments: many(commentsTable),
    reactions: many(postsReactionsTable),
    media: many(mediaTable)
}));

export const commentsRelations = relations(commentsTable, ({ one }) => ({
    post: one(postsTable, { fields: [commentsTable.postId], references: [postsTable.id] })
}));
```

## Query Patterns

### Select with Join

```typescript
import { eq, and, desc, inArray } from 'drizzle-orm';

const results = await db
    .select({
        id: postsTable.id,
        content: postsTable.content,
        authorName: users.name,
        authorImage: users.image
    })
    .from(postsTable)
    .innerJoin(users, eq(postsTable.userId, users.id))
    .where(eq(postsTable.status, 'approved'))
    .orderBy(desc(postsTable.createdAt))
    .limit(10)
    .offset(0);
```

### Insert with Returning

```typescript
const [post] = await db
    .insert(postsTable)
    .values({
        userId,
        content,
        status: 'pending',
        createdAt: new Date().toISOString()
    })
    .returning();
```

### Update

```typescript
await db
    .update(postsTable)
    .set({ status: 'approved', updatedAt: new Date().toISOString() })
    .where(eq(postsTable.id, postId));
```

### Delete

```typescript
await db
    .delete(postsReactionsTable)
    .where(and(
        eq(postsReactionsTable.userId, userId),
        eq(postsReactionsTable.postId, postId)
    ));
```

### Count

```typescript
import { count } from 'drizzle-orm';

const [result] = await db
    .select({ count: count() })
    .from(commentsTable)
    .where(eq(commentsTable.postId, postId));
```

### Aggregation with Group By

```typescript
const commentsCounts = await db
    .select({
        postId: commentsTable.postId,
        count: count()
    })
    .from(commentsTable)
    .where(inArray(commentsTable.postId, postIds))
    .groupBy(commentsTable.postId);
```

### Table Alias (Self-Join)

```typescript
import { aliasedTable } from 'drizzle-orm';

const uf2 = aliasedTable(usersFollowersTable, 'uf2');

const results = await db
    .select({ id: users.id, name: users.name })
    .from(usersFollowersTable)
    .innerJoin(uf2, and(
        eq(usersFollowersTable.followedUserId, uf2.userId),
        eq(usersFollowersTable.userId, uf2.followedUserId)
    ))
    .innerJoin(users, eq(users.id, usersFollowersTable.followedUserId))
    .where(eq(usersFollowersTable.userId, userId));
```

### Raw SQL

```typescript
import { sql } from 'drizzle-orm';

// Computed columns
const matchType = sql<'primary' | 'additional'>`
    CASE WHEN ${inArray(profilesTable.instrument, instruments)}
    THEN 'primary' ELSE 'additional' END
`.as('match_type');

// Subquery condition
const hasInstrument = sql`EXISTS (
    SELECT 1 FROM ${instrumentsTable}
    WHERE ${instrumentsTable.userId} = ${users.id}
    AND ${inArray(instrumentsTable.instrument, instruments)}
)`;

// Raw query execution (FTS)
const { results } = await db.run(sql.raw(`
    SELECT u.id, u.name FROM users_fts f
    JOIN users u ON u.rowid = f.rowid
    WHERE users_fts MATCH '${query}';
`));
```

### Pagination

```typescript
const page = 1;
const limit = 12;
const offset = (page - 1) * limit;

const results = await db
    .select()
    .from(postsTable)
    .orderBy(desc(postsTable.createdAt))
    .limit(limit)
    .offset(offset);

const [{ total }] = await db.select({ total: count() }).from(postsTable);
const totalPages = Math.ceil(total / limit);
const hasMore = page < totalPages;
```

## Full-Text Search (FTS5)

FTS tables require manual SQL migrations (not generated by Drizzle):

```sql
-- Create FTS virtual table
CREATE VIRTUAL TABLE users_fts USING fts5(
    name,
    content='users',
    content_rowid='rowid'
);

-- Populate with existing data
INSERT INTO users_fts(rowid, name) SELECT rowid, name FROM users;

-- Create triggers to keep in sync
CREATE TRIGGER users_fts_insert AFTER INSERT ON users BEGIN
    INSERT INTO users_fts(rowid, name) VALUES (new.rowid, new.name);
END;

CREATE TRIGGER users_fts_delete AFTER DELETE ON users BEGIN
    INSERT INTO users_fts(users_fts, rowid, name) VALUES('delete', old.rowid, old.name);
END;

CREATE TRIGGER users_fts_update AFTER UPDATE ON users BEGIN
    INSERT INTO users_fts(users_fts, rowid, name) VALUES('delete', old.rowid, old.name);
    INSERT INTO users_fts(rowid, name) VALUES (new.rowid, new.name);
END;
```

## Zod Schema Synchronization

Every table needs matching Zod schemas in `packages/common/src/types/drizzle.ts`:

```typescript
import { z } from 'zod';

// For creating records (dates may be Date objects)
export const createPostSchema = z.object({
    id: z.number(),
    userId: z.string(),
    content: z.string(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

// For reading records (dates are ISO strings)
export const postSchema = z.object({
    id: z.number(),
    userId: z.string(),
    content: z.string(),
    status: z.string(),
    createdAt: z.string(),
    updatedAt: z.string().nullable()
});

export type CreatePost = z.infer<typeof createPostSchema>;
export type Post = z.infer<typeof postSchema>;
```

## Migration Workflow

### 1. Generate Migration

After modifying schema:

```bash
pnpm db:generate
```

This creates a new file in `packages/drizzle/migrations/`.

### 2. Update Zod Schemas

Manually update `packages/common/src/types/drizzle.ts` to match schema changes.

### 3. Apply Migration (Local)

```bash
pnpm --filter @sound-connect/api db:migrate:local
```

This also runs `pnpm db:seed:local` automatically.

### 4. Apply Migration (Remote)

```bash
pnpm --filter @sound-connect/api db:migrate:remote
```

### Manual Migrations (FTS, Complex SQL)

For FTS tables or complex operations not supported by Drizzle Kit:

1. Create a numbered SQL file in `packages/drizzle/migrations/`
2. Use `statement-breakpoint` separator between statements
3. Add comment header explaining purpose

```sql
-- Migration: Create full-text search for users
-- Created: 2025-11-15
-- Purpose: Enable fast user search by name

CREATE VIRTUAL TABLE users_fts USING fts5(name, content='users', content_rowid='rowid');
--> statement-breakpoint
INSERT INTO users_fts(rowid, name) SELECT rowid, name FROM users;
```

## Index Strategy

Create indexes for:
- Foreign key columns (always)
- Columns used in WHERE clauses
- Columns used in ORDER BY
- Composite indexes for multi-column queries (order matters)

```typescript
(table) => ({
    // Single column for FK lookups
    userIdIdx: index('idx_posts_user_id').on(table.userId),

    // Composite for filtered + sorted queries
    statusCreatedIdx: index('idx_posts_status_created').on(table.status, table.createdAt),

    // Composite for geolocation queries
    locationIdx: index('idx_profiles_location').on(table.latitude, table.longitude),

    // Composite for relationship lookups
    followerBandIdx: index('idx_followers_pair').on(table.followerId, table.bandId)
})
```

## Out of Scope

- API endpoint implementation (see hono skill)
- D1 database bindings/configuration (see cloudflare skill)
- TypeScript utility types (see typescript skill)
