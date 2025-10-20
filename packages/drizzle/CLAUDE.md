# Drizzle Package

This package contains the database schema definitions and migration files for the Sound Connect application using Drizzle ORM with Cloudflare D1 (SQLite).

📚 **[← Back to Main Documentation](../../CLAUDE.md)**

## Contents

- `src/schema.ts` - Database table definitions and relations
- `src/migrations/` - SQL migration files managed by Drizzle Kit

## Database Schema

The database uses SQLite (Cloudflare D1) with the following main tables:

- **Authentication tables** (managed by better-auth): users, sessions, accounts, verifications
- **Social features**: posts, comments, reactions, media, messages
- **Music groups**: music_groups, music_groups_members, music_groups_followers
- **User relationships**: users_followers

## AI Rules

### Column Naming Convention

- Database column names MUST use snake_case (e.g., `created_at`, `user_id`, `post_id`)
- All columns MUST have explicit column names specified in the schema definition

### Date Field Types

- **Authentication tables** (users, sessions, accounts, verifications): Use `integer({ mode: 'timestamp' })` for date fields
    - better-auth expects Date objects which Drizzle converts to/from Unix timestamps
- **Application tables** (posts, comments, messages, etc.): Use `text()` for date fields
    - Stores ISO 8601 strings for JSON serialization compatibility

### After Schema Changes

When you modify `src/schema.ts`, you MUST:

1. **Generate migration files**:

    ```bash
    cd apps/api
    pnpm db:generate
    ```

2. **Update Zod schemas**: Manually update the schemas in `packages/common/src/types/drizzle.ts` to match the database schema
    - Create both insert and select schemas for each table
    - Use `.nullable()` for optional fields
    - Ensure date field types match the schema (Date for auth tables, string for application tables)
    - All schemas are manually maintained (drizzle-zod is NOT used)

3. **Apply migrations locally**:
    ```bash
    cd apps/api
    pnpm db:migrate:local
    ```

### Schema Definition Guidelines

- Always specify explicit column names for all fields
- Use proper foreign key references with `onDelete` actions
- Mark all required fields with `.notNull()`
- Define relations separately from table definitions
- Use TypeScript `as const` for enum definitions before using them in schemas
