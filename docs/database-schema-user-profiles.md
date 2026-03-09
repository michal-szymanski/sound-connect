# Database Schema: User Profile Enhancements

## Overview

This document describes the database schema design for enhanced musician profiles in Sound Connect. The schema supports rich profile data to help musicians find bands and showcase their skills.

## Implementation Date

2025-11-07

## Schema Changes

### 1. Modified Table: `users`

**Added Column:**
- `last_active_at` (TEXT, nullable) - ISO 8601 timestamp of user's last activity

**Purpose:** Track user activity for displaying "last active" indicators on profiles.

**Update Strategy:** Updated via middleware on every authenticated API request.

---

### 2. New Table: `user_profiles`

**Purpose:** Store comprehensive musician profile information separate from core user authentication data.

**Schema:**

```sql
CREATE TABLE `user_profiles` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `user_id` TEXT NOT NULL UNIQUE,

  -- Instruments Section
  `primary_instrument` TEXT,
  `years_playing_primary` INTEGER,
  `seeking_to_play` TEXT,  -- JSON array of instruments

  -- Genres Section
  `primary_genre` TEXT,
  `secondary_genres` TEXT,  -- JSON array (max 3)
  `influences` TEXT,        -- Free text (max 500 chars)

  -- Availability Section
  `status` TEXT,
  `status_expires_at` TEXT,
  `commitment_level` TEXT,
  `weekly_availability` TEXT,  -- Free text (max 200 chars)
  `rehearsal_frequency` TEXT,

  -- Experience Section
  `gigging_level` TEXT,
  `past_bands` TEXT,           -- Free text (max 500 chars)
  `has_studio_experience` INTEGER,  -- Boolean (0/1)

  -- Logistics Section
  `city` TEXT,
  `state` TEXT,
  `country` TEXT,
  `travel_radius` INTEGER,          -- Miles (0-500)
  `has_rehearsal_space` INTEGER,    -- Boolean (0/1)
  `has_transportation` INTEGER,     -- Boolean (0/1)

  -- Looking For Section
  `seeking` TEXT,              -- Free text (max 500 chars)
  `can_offer` TEXT,            -- Free text (max 500 chars)
  `deal_breakers` TEXT,        -- Free text (max 300 chars)

  -- Bio Section
  `bio` TEXT,                  -- Free text (max 500 chars)
  `musical_goals` TEXT,        -- Free text (max 300 chars)
  `age_range` TEXT,            -- Free text (max 20 chars)

  -- Meta
  `profile_completion` INTEGER DEFAULT 0 NOT NULL,
  `setup_completed` INTEGER DEFAULT 0 NOT NULL,  -- Boolean (0/1)
  `created_at` TEXT NOT NULL,
  `updated_at` TEXT,

  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_user_profiles_user_id` - Fast lookup by user_id (JOIN optimization)
- `idx_user_profiles_status` - Search/filter by availability status
- `idx_user_profiles_primary_genre` - Search/filter by genre
- `idx_user_profiles_city` - Search/filter by location

**Unique Constraint:**
- `user_id` - One profile per user

---

### 3. New Table: `user_additional_instruments`

**Purpose:** Store additional instruments beyond primary instrument. Separate table avoids JSON parsing overhead and enables efficient querying.

**Schema:**

```sql
CREATE TABLE `user_additional_instruments` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT,
  `user_id` TEXT NOT NULL,
  `instrument` TEXT NOT NULL,
  `years` INTEGER NOT NULL,
  `created_at` TEXT NOT NULL,

  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_user_additional_instruments_user_id` - Fast lookup for user's instruments
- `idx_user_additional_instruments_instrument` - Search/filter by instrument type

**Constraints:**
- Maximum 4 additional instruments per user (enforced at application level)
- Cannot duplicate primary instrument (enforced at application level)

---

## Enums (TypeScript)

All enum values are defined in TypeScript and validated on both client and server.

**Location:** `packages/common/src/types/profile-enums.ts`

### InstrumentEnum
```typescript
'guitar', 'bass_guitar', 'drums', 'keyboards', 'vocals',
'saxophone', 'trumpet', 'trombone', 'violin', 'cello',
'flute', 'clarinet', 'harmonica', 'banjo', 'mandolin',
'ukulele', 'percussion', 'synth', 'dj', 'production'
```

### GenreEnum
```typescript
'rock', 'pop', 'jazz', 'blues', 'country', 'folk',
'metal', 'punk', 'hardcore', 'indie', 'alternative',
'progressive_rock', 'psychedelic', 'classic_rock',
'electronic', 'edm', 'house', 'techno', 'dubstep',
'hip_hop', 'rap', 'rnb', 'soul', 'funk', 'disco',
'reggae', 'ska', 'latin', 'salsa', 'bossa_nova',
'classical', 'opera', 'jazz_fusion', 'bebop', 'swing',
'bluegrass', 'gospel', 'experimental', 'ambient', 'world'
```

### AvailabilityStatusEnum
```typescript
'actively_looking', 'open_to_offers', 'not_looking', 'just_browsing'
```

### CommitmentLevelEnum
```typescript
'hobbyist', 'serious_amateur', 'professional'
```

### RehearsalFrequencyEnum
```typescript
'1x_per_week', '2-3x_per_week', '4+_per_week', 'flexible'
```

### GiggingLevelEnum
```typescript
'beginner', 'local', 'regional', 'touring', 'professional'
```

---

## Design Decisions

### 1. Why TEXT for Date Fields?

**Decision:** Use `text()` type for date fields in application tables (not auth tables).

**Rationale:**
- Per CLAUDE.md rules: "Application tables: Use `text()` for date fields (stores ISO 8601 strings for JSON serialization)"
- Auth tables use `integer({ mode: 'timestamp_ms' })` for better-auth compatibility
- ISO 8601 strings serialize cleanly to JSON responses
- SQLite doesn't have native date types anyway

### 2. Why Separate Table for Additional Instruments?

**Decision:** Store additional instruments in `user_additional_instruments` table instead of JSON column.

**Rationale:**
- **Search Performance:** Can create index on `instrument` column for future search/filter features
- **Query Simplicity:** Standard SQL JOIN instead of JSON extraction functions
- **Type Safety:** Drizzle ORM enforces enum constraints
- **Low Overhead:** Max 4 rows per user, negligible JOIN cost
- **Normalization:** Avoids JSON parsing/serialization overhead

**Alternatives Considered:**
- JSON column: Harder to query, no index support in D1
- Single `instruments` text column with comma-separated values: Poor queryability, no validation

### 3. Why Denormalize `profile_completion`?

**Decision:** Store `profile_completion` percentage in `user_profiles` table.

**Rationale:**
- **Read Performance:** O(1) lookup vs. calculating on every profile fetch
- **Simplicity:** Single query instead of complex aggregation
- **Consistency:** Server is single source of truth for calculation logic
- **Display:** Needed on profile header, user cards, search results

**Maintenance:** Recalculated on every profile update via application logic.

### 4. Why `seeking_to_play` as JSON Text?

**Decision:** Store `seeking_to_play` instruments as JSON array string instead of separate table.

**Rationale:**
- **Simple Relationship:** Just a list of instrument names, no additional metadata
- **Infrequent Writes:** Set once, rarely changed
- **Small Data:** Max 5 instruments (primary + 4 additional)
- **No Complex Queries:** Not used for filtering/search (that's `primary_instrument` + `user_additional_instruments`)

### 5. Index Strategy

**Indexes Created:**
- `user_profiles.user_id` - Required for JOIN with users table
- `user_profiles.status` - Future feature: "Find actively looking musicians"
- `user_profiles.primary_genre` - Future feature: "Find jazz musicians"
- `user_profiles.city` - Future feature: "Find local musicians"
- `user_additional_instruments.user_id` - Required for JOIN
- `user_additional_instruments.instrument` - Future feature: "Find bassists"

**Indexes NOT Created:**
- Free-text fields (bio, influences, etc.) - Would use full-text search (Phase 2)
- Numeric fields (years, travel_radius) - Range queries not primary use case
- Boolean fields - Too few distinct values to benefit from index

### 6. Why No `username` in Profiles?

**Decision:** Username already exists in `users` table.

**Rationale:**
- Avoid duplication - username is core identity, not profile data
- Profile data is "enhancements" to existing user record
- Username displayed via JOIN with `users` table

### 7. Cascade Deletes

**Decision:** All foreign keys use `ON DELETE CASCADE`.

**Rationale:**
- When user deletes account, all profile data should be removed
- No orphaned profile data
- Cleaner database, easier maintenance
- Follows GDPR "right to be forgotten" principles

---

## Migration Strategy

### Running the Migration

1. **Generate Migration:**
   ```bash
   cd /Users/michal.szymanski/Projects/sound-connect
   pnpm db:generate
   ```

   This will generate a migration file from the schema changes.

2. **Apply Migration Locally:**
   ```bash
   pnpm --filter @sound-connect/api db:migrate:local
   ```

3. **Apply Migration to Production:**
   ```bash
   pnpm --filter @sound-connect/api db:migrate:remote
   ```

### Rollback Plan

If migration fails or needs to be rolled back:

```sql
-- Rollback SQL
DROP TABLE IF EXISTS `user_additional_instruments`;
DROP TABLE IF EXISTS `user_profiles`;
ALTER TABLE `users` DROP COLUMN `last_active_at`;
```

**Note:** SQLite doesn't support `DROP COLUMN` directly. Would require:
1. Rename `users` table
2. Create new `users` table without `last_active_at`
3. Copy data from old table
4. Drop old table

**Recommendation:** Test thoroughly on local/dev before production deployment.

---

## Data Integrity Rules

### Enforced by Database
- Foreign key constraints (`user_id` must exist in `users` table)
- Unique constraint (one profile per user)
- NOT NULL constraints on required fields (`user_id`, `profile_completion`, etc.)
- Cascade deletes (profile deleted when user deleted)

### Enforced by Application
- Enum validation (instrument/genre/status values must be in allowed list)
- Max length validation (bio: 500 chars, influences: 500 chars, etc.)
- Business logic (max 4 additional instruments, cannot duplicate primary)
- Range validation (years: 0-70, travel_radius: 0-500)
- Conditional requirements (statusExpiresAt required if status = 'actively_looking')

---

## Query Patterns

### Fetch User Profile (with additional instruments)
```typescript
const profile = await db
  .select()
  .from(userProfilesTable)
  .leftJoin(
    userAdditionalInstrumentsTable,
    eq(userProfilesTable.userId, userAdditionalInstrumentsTable.userId)
  )
  .where(eq(userProfilesTable.userId, userId));
```

### Update Profile Section
```typescript
await db
  .update(userProfilesTable)
  .set({
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    updatedAt: new Date().toISOString()
  })
  .where(eq(userProfilesTable.userId, userId));
```

### Add Additional Instrument
```typescript
await db.insert(userAdditionalInstrumentsTable).values({
  userId,
  instrument: 'guitar',
  years: 5,
  createdAt: new Date().toISOString()
});
```

### Search Musicians by Genre (Future)
```typescript
const musicians = await db
  .select()
  .from(userProfilesTable)
  .innerJoin(users, eq(userProfilesTable.userId, users.id))
  .where(eq(userProfilesTable.primaryGenre, 'jazz'))
  .orderBy(desc(users.lastActiveAt))
  .limit(20);
```

---

## Performance Considerations

### Expected Query Times
- Profile fetch (with JOIN): < 10ms
- Profile update: < 20ms
- Additional instruments fetch: < 5ms

### Optimization Strategies
1. **Indexes:** All foreign keys and search fields indexed
2. **Denormalization:** Profile completion stored, not calculated
3. **Small Tables:** Max 1 profile + 4 instruments per user
4. **Efficient JOINs:** SQLite handles small JOINs efficiently

### Future Optimizations (if needed)
- Cache full profile in Cloudflare KV (5 min TTL)
- Paginate search results (LIMIT/OFFSET)
- Add composite indexes for common search queries

---

## Testing Checklist

Before marking migration complete:

- [ ] Migration SQL is valid SQLite syntax
- [ ] Foreign key constraints are correct
- [ ] Indexes are created properly
- [ ] Cascade deletes work (test user deletion)
- [ ] Enum values match TypeScript definitions
- [ ] Zod schemas match database schema
- [ ] All fields have correct nullability
- [ ] Default values are set correctly
- [ ] Profile completion calculation works
- [ ] Additional instruments can be added/removed

---

## Related Files

**Schema Definitions:**
- `/packages/drizzle/src/schema.ts`
- `/packages/common/src/types/profile-enums.ts`

**Type Definitions:**
- `/packages/common/src/types/drizzle.ts`

**Migration:**
- `/packages/drizzle/migrations/0003_user_profile_enhancements.sql`

**Specification:**
- `/specs/user-profile-enhancements.md`

---

## Next Steps

After database schema is complete:

1. **Backend Implementation** - Create API endpoints for profile CRUD operations
2. **Validation Schemas** - Create API validation schemas with character limits
3. **Profile Completion Logic** - Implement calculation algorithm
4. **Frontend Components** - Build profile view and edit forms
5. **Testing** - Write E2E tests for profile flows
6. **Search Integration (Phase 2)** - Use indexed fields for advanced search

---

## Questions/Concerns

**Raised During Implementation:**

1. **Should `age_range` be required?**
   - Current: Optional
   - Consideration: Privacy vs. matchmaking accuracy
   - Decision: Keep optional for MVP

2. **Expiration handling for `actively_looking` status?**
   - Current: On-read check (simpler)
   - Alternative: Scheduled worker (more accurate)
   - Decision: On-read for MVP, consider scheduled worker in Phase 2

3. **Profile completion visibility to other users?**
   - Current: Visible only to profile owner
   - Alternative: Show to everyone (might discourage contacting "incomplete" profiles)
   - Decision: Owner-only for MVP

---

## Database Architect Notes

**Designed by:** Database Architect Agent
**Date:** 2025-11-07
**Version:** 1.0

This schema follows SQLite/D1 best practices:
- ✅ Text fields for application dates (ISO 8601)
- ✅ Integer fields for auth dates (timestamp_ms for better-auth)
- ✅ Snake_case column names
- ✅ Explicit column name definitions
- ✅ Proper foreign key constraints with cascades
- ✅ Strategic indexing for performance
- ✅ Denormalization where appropriate
- ✅ Normalized where needed (additional instruments)
- ✅ TypeScript enums for validation
- ✅ Future-proof for search functionality
