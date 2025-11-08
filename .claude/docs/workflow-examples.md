# Sound Connect Agent Workflow Examples

This document provides detailed examples of how to use the agent workflow for common tasks.

## Table of Contents

1. [New Feature: Full-Stack](#new-feature-full-stack)
2. [New Feature: Frontend-Only](#new-feature-frontend-only)
3. [New Feature: Backend-Only](#new-feature-backend-only)
4. [New Feature: Real-Time](#new-feature-real-time)
5. [Bug Fix: Frontend](#bug-fix-frontend)
6. [Bug Fix: Backend](#bug-fix-backend)
7. [Bug Fix: Multi-Domain](#bug-fix-multi-domain)
8. [Database Schema Changes](#database-schema-changes)
9. [Refactoring: Multi-Domain](#refactoring-multi-domain)
10. [Adding Tests](#adding-tests)

---

## New Feature: Full-Stack

**Scenario:** User wants to add a "bookmark posts" feature where users can save posts to read later.

### User Invocation

```
User: I want to add a bookmarking feature so users can save posts to read later
```

### Workflow

```
1. Invoke: feature-spec-writer
   └─ Agent: feature-spec-writer
      ├─ Asks clarifying questions:
      │  • Where should bookmarks be displayed? (separate page, in profile, etc.)
      │  • Should bookmarks be organized? (folders, tags, or flat list)
      │  • Should there be a limit on bookmarks?
      ├─ Creates spec: /specs/post-bookmarks.md
      │  • Problem: Users want to save posts for later reading
      │  • Success: Users can bookmark/unbookmark, view bookmarks list
      │  • Scope: Bookmark button, bookmarks page, no folders (v1)
      │  • API: POST /bookmarks, DELETE /bookmarks/:id, GET /bookmarks
      │  • DB: bookmarks table with user_id, post_id, created_at
      ├─ Auto-delegates (parallel):
      │  ├─ Task(designer)
      │  │  └─ Returns: Bookmark icon (ShadCN), placement in PostCard,
      │  │              bookmarks page layout, empty state design
      │  └─ Task(database-architect)
      │     └─ Returns: Schema for bookmarks table,
      │                 composite unique index on (user_id, post_id),
      │                 foreign keys with CASCADE delete
      └─ Auto-delegates (sequential):
         └─ Task(system-architect)
            └─ Agent: system-architect
               ├─ Creates Zod schemas in packages/common:
               │  • createBookmarkSchema
               │  • bookmarkSchema
               ├─ Delegates to backend:
               │  └─ Task(backend)
               │     └─ Agent: backend
               │        ├─ Creates bookmarks table migration
               │        ├─ Implements API endpoints:
               │        │  • POST /api/bookmarks
               │        │  • DELETE /api/bookmarks/:id
               │        │  • GET /api/bookmarks
               │        └─ Invokes: code-quality-enforcer
               └─ Delegates to frontend:
                  └─ Task(frontend)
                     └─ Agent: frontend
                        ├─ Creates components:
                        │  • bookmark-button.tsx
                        │  • bookmarks-page.tsx
                        ├─ Creates server functions:
                        │  • createBookmark
                        │  • deleteBookmark
                        │  • getBookmarks
                        ├─ Creates Tanstack Query hooks:
                        │  • useBookmarks
                        │  • useCreateBookmark
                        │  • useDeleteBookmark
                        └─ Invokes: code-quality-enforcer
```

### Key Takeaways

- feature-spec-writer handles the entire workflow
- designer and database-architect run in parallel (no dependencies)
- system-architect coordinates after design/DB complete
- frontend and backend can run in parallel (both receive Zod schemas)
- code-quality-enforcer runs automatically at the end

---

## New Feature: Frontend-Only

**Scenario:** User wants to add a dark mode toggle.

### User Invocation

```
User: Add dark mode support with a toggle in the settings page
```

### Workflow

```
1. Invoke: feature-spec-writer
   └─ Agent: feature-spec-writer
      ├─ Asks clarifying questions:
      │  • Should it respect system preference?
      │  • Should preference persist?
      │  • Where should the toggle be? (settings only or header too?)
      ├─ Creates spec: /specs/dark-mode.md
      │  • Problem: Users want dark mode for night reading
      │  • Success: Toggle switches theme, persists preference
      │  • Scope: Light/dark themes, toggle in settings, system preference detection
      │  • No API needed (client-side only)
      │  • No DB needed (localStorage)
      ├─ Auto-delegates:
      │  └─ Task(designer)
      │     └─ Returns: Dark color palette (bg, text, borders, etc.),
      │                 toggle UI (ShadCN switch component),
      │                 WCAG contrast ratios verified
      └─ Auto-delegates (skips system-architect for frontend-only):
         └─ Task(frontend)
            └─ Agent: frontend
               ├─ Creates theme context:
               │  • ThemeProvider with light/dark/system modes
               │  • useTheme hook
               │  • localStorage persistence
               ├─ Updates Tailwind config:
               │  • Dark mode class strategy
               │  • Dark variants for all colors
               ├─ Creates components:
               │  • theme-toggle.tsx (settings page)
               ├─ Updates existing components:
               │  • Add dark: variants to key components
               └─ Invokes: code-quality-enforcer
```

### Key Takeaways

- No database-architect needed (no DB changes)
- No system-architect needed (frontend-only)
- feature-spec-writer delegates directly to frontend
- Faster workflow for single-domain features

---

## New Feature: Backend-Only

**Scenario:** User wants to add automated content moderation using an external API.

### User Invocation

```
User: Add automated content moderation to flag inappropriate posts using a moderation API
```

### Workflow

```
1. Invoke: feature-spec-writer
   └─ Agent: feature-spec-writer
      ├─ Asks clarifying questions:
      │  • What moderation API? (user chooses: OpenAI Moderation API)
      │  • Auto-delete or flag for review?
      │  • Moderate only new posts or existing too?
      ├─ Creates spec: /specs/content-moderation.md
      │  • Problem: Prevent inappropriate content
      │  • Success: New posts moderated, flagged content hidden
      │  • Scope: Moderate on post creation, flag in DB, admin review queue
      │  • API: Update POST /posts to trigger moderation
      │  • DB: Add moderation_status to posts table
      ├─ Auto-delegates:
      │  └─ Task(database-architect)
      │     └─ Returns: Add moderation_status column (enum: pending, approved, flagged),
      │                 moderation_reason column (text),
      │                 index on moderation_status for admin queries
      └─ Auto-delegates (skips designer and system-architect for backend-only):
         └─ Task(backend)
            └─ Agent: backend
               ├─ Updates posts table migration:
               │  • Add moderation_status column
               │  • Add moderation_reason column
               │  • Add index
               ├─ Updates packages/common:
               │  • Add ModerationStatus enum
               │  • Update postSchema
               ├─ Implements moderation logic:
               │  • calls OpenAI Moderation API
               │  • updates post status based on result
               │  • logs moderation decisions
               ├─ Updates POST /posts endpoint:
               │  • Triggers moderation after creation
               │  • Returns post with moderation_status
               ├─ Creates admin endpoints:
               │  • GET /admin/moderation/flagged
               │  • PATCH /admin/moderation/:id/approve
               └─ Invokes: code-quality-enforcer
```

### Key Takeaways

- No designer needed (no UI changes in v1)
- No system-architect needed (backend-only)
- feature-spec-writer delegates directly to backend
- Backend still updates packages/common for shared enums

---

## New Feature: Real-Time

**Scenario:** User wants to add typing indicators in chat.

### User Invocation

```
User: Add typing indicators so users can see when someone is typing in a chat conversation
```

### Workflow

```
1. Invoke: feature-spec-writer
   └─ Agent: feature-spec-writer
      ├─ Asks clarifying questions:
      │  • Show "X is typing..." or just animated dots?
      │  • How long should typing indicator persist after last keystroke?
      │  • Should it work in group chats?
      ├─ Creates spec: /specs/typing-indicators.md
      │  • Problem: Users don't know if the other person is responding
      │  • Success: See typing indicator, disappears after 3s of inactivity
      │  • Scope: 1-on-1 chats only (v1), WebSocket events, debouncing
      │  • WebSocket events: typing_start, typing_stop
      │  • No DB needed (ephemeral state in Durable Object)
      ├─ Auto-delegates:
      │  └─ Task(designer)
      │     └─ Returns: Animated typing dots (3 dots bouncing),
      │                 placement below message list,
      │                 "X is typing..." text + animation
      └─ Auto-delegates (uses realtime-architect for WebSocket features):
         └─ Task(realtime-architect)
            └─ Agent: realtime-architect
               ├─ Updates packages/common:
               │  • Define WebSocket event types:
               │    - TypingStartEvent
               │    - TypingStopEvent
               ├─ Updates Durable Object (ChatRoom):
               │  • Handle typing_start event:
               │    - Broadcast to other user
               │    - Store typing state
               │    - Set 3s timeout to auto-stop
               │  • Handle typing_stop event:
               │    - Clear timeout
               │    - Broadcast stop to other user
               ├─ Updates frontend:
               │  └─ Task(frontend)
               │     └─ Agent: frontend
               │        ├─ Updates chat input component:
               │        │  • Emit typing_start on keypress (debounced)
               │        │  • Emit typing_stop on blur or 3s timeout
               │        ├─ Creates typing-indicator component:
               │        │  • Animated dots
               │        │  • Display when receiving typing event
               │        ├─ Updates WebSocket listener:
               │        │  • Handle typing_start → show indicator
               │        │  • Handle typing_stop → hide indicator
               │        └─ Invokes: code-quality-enforcer
               └─ Invokes: code-quality-enforcer
```

### Key Takeaways

- realtime-architect handles both backend (Durable Objects) and frontend coordination
- Designer provides UI guidance for the typing animation
- No database changes needed (ephemeral state)
- realtime-architect delegates to frontend for client-side implementation

---

## Bug Fix: Frontend

**Scenario:** User reports that profile images aren't uploading correctly.

### User Invocation

```
User: Fix the bug where profile images fail to upload and show an error
```

### Workflow

```
1. Invoke: frontend
   └─ Agent: frontend
      ├─ Investigates issue:
      │  • Reads profile-image-upload component
      │  • Checks browser console logs
      │  • Reviews server function
      ├─ Identifies bug:
      │  • Missing Content-Type header in fetch
      │  • File size validation incorrect
      ├─ Fixes bug:
      │  • Adds proper Content-Type header
      │  • Fixes file size check (5MB limit)
      │  • Improves error messages
      ├─ Tests fix:
      │  • Manual testing: uploads small and large images
      │  • Verifies error handling
      └─ Invokes: code-quality-enforcer
```

### Key Takeaways

- No spec needed for bug fixes
- Direct invocation of frontend agent
- Agent investigates, fixes, and validates
- code-quality-enforcer runs automatically

---

## Bug Fix: Backend

**Scenario:** API endpoint returns 500 error when deleting a post with comments.

### User Invocation

```
User: Fix the DELETE /posts/:id endpoint - it crashes when deleting posts that have comments
```

### Workflow

```
1. Invoke: backend
   └─ Agent: backend
      ├─ Investigates issue:
      │  • Reads DELETE /posts/:id handler
      │  • Checks database schema (foreign keys)
      │  • Reviews error logs
      ├─ Identifies bug:
      │  • Foreign key constraint violation
      │  • Comments not deleted before post
      │  • No CASCADE delete on comments.post_id
      ├─ Fixes bug:
      │  • Option 1: Add CASCADE delete to foreign key
      │  • Option 2: Explicitly delete comments first
      │  • Chooses: Update migration to add CASCADE
      ├─ Updates migration:
      │  • Modifies comments table foreign key
      │  • Adds onDelete: 'cascade'
      ├─ Tests fix:
      │  • Deletes post with comments
      │  • Verifies comments auto-deleted
      │  • Checks no orphaned data
      └─ Invokes: code-quality-enforcer
```

### Key Takeaways

- No spec needed for bug fixes
- Direct invocation of backend agent
- Agent fixes both code and database schema
- Tests to verify fix works

---

## Bug Fix: Multi-Domain

**Scenario:** Posts created through the frontend show incorrect timestamps.

### User Invocation

```
User: Fix timestamp bug - posts show wrong creation time, seems like a timezone issue between frontend and backend
```

### Workflow

```
1. Invoke: system-architect
   └─ Agent: system-architect
      ├─ Investigates issue:
      │  • Checks frontend post creation
      │  • Checks backend POST /posts handler
      │  • Reviews database schema (created_at column type)
      │  • Examines Zod schema in packages/common
      ├─ Identifies bug:
      │  • Frontend sends timestamp as Date object
      │  • Backend stores as ISO string
      │  • Frontend parses back incorrectly
      │  • No timezone handling
      ├─ Fixes across stack:
      │  ├─ Updates packages/common:
      │  │  • postSchema uses .datetime() for created_at
      │  │  • Ensures ISO 8601 format with timezone
      │  ├─ Delegates to backend:
      │  │  └─ Task(backend)
      │  │     └─ Agent: backend
      │  │        ├─ Updates POST /posts handler:
      │  │        │  • Always store ISO string with UTC
      │  │        │  • Validate with updated schema
      │  │        └─ Invokes: code-quality-enforcer
      │  └─ Delegates to frontend:
      │     └─ Task(frontend)
      │        └─ Agent: frontend
      │           ├─ Updates post-form component:
      │           │  • Send ISO string instead of Date
      │           │  • Use .toISOString()
      │           ├─ Updates post-card component:
      │           │  • Parse ISO string correctly
      │           │  • Display in user's local timezone
      │           └─ Invokes: code-quality-enforcer
      └─ Verifies fix:
         • Creates post from frontend
         • Checks stored value in DB
         • Checks displayed value
         • Tests across timezones
```

### Key Takeaways

- Multi-domain bugs need system-architect coordination
- Fix spans packages/common, backend, and frontend
- Ensures type safety and consistency across stack
- system-architect delegates to specialized agents

---

## Database Schema Changes

**Scenario:** User wants to add user profile fields (bio, location, instruments).

### User Invocation

```
User: Add bio, location, and instruments fields to user profiles
```

### Workflow

```
1. Invoke: database-architect
   └─ Agent: database-architect
      ├─ Analyzes requirements:
      │  • bio: Long text field (max 500 chars)
      │  • location: String (city, state, country)
      │  • instruments: Array of strings (guitar, drums, etc.)
      ├─ Designs schema:
      │  • Add bio TEXT column to users table
      │  • Add location TEXT column
      │  • Create instruments table (many-to-many):
      │    - user_instruments: user_id, instrument_id
      │    - instruments: id, name (predefined list)
      │  • Indexes: location for search, instruments for filtering
      ├─ Creates migration plan:
      │  • Migration 1: Add bio, location to users
      │  • Migration 2: Create instruments tables
      │  • Seed data: Popular instruments
      ├─ Delegates to backend:
      │  └─ Task(backend)
      │     └─ Agent: backend
      │        ├─ Creates migrations:
      │        │  • 001_add_profile_fields.sql
      │        │  • 002_add_instruments_tables.sql
      │        │  • 003_seed_instruments.sql
      │        ├─ Updates Drizzle schema:
      │        │  • users table with new columns
      │        │  • instruments table
      │        │  • userInstruments relation
      │        ├─ Updates packages/common:
      │        │  • userProfileSchema with new fields
      │        │  • instrumentSchema
      │        │  • Zod validation rules
      │        ├─ Updates API endpoints:
      │        │  • PATCH /users/:id to accept new fields
      │        │  • GET /instruments for predefined list
      │        └─ Invokes: code-quality-enforcer
      └─ Provides migration instructions:
         • Run: pnpm db:generate
         • Update Zod schemas manually
         • Run: pnpm --filter @sound-connect/api db:migrate:local
```

### Key Takeaways

- database-architect designs schema first
- Delegates implementation to backend
- backend creates migrations and updates Drizzle schema
- Also updates packages/common for shared types

---

## Refactoring: Multi-Domain

**Scenario:** User wants to refactor authentication to use a shared auth context.

### User Invocation

```
User: Refactor authentication - create shared auth utilities in packages/common and simplify frontend/backend code
```

### Workflow

```
1. Invoke: system-architect
   └─ Agent: system-architect
      ├─ Analyzes current state:
      │  • Frontend duplicates auth logic in multiple places
      │  • Backend has scattered auth checks
      │  • No shared types for auth tokens
      ├─ Plans refactoring:
      │  ├─ packages/common:
      │  │  • authTokenSchema (Zod)
      │  │  • authUserSchema (Zod)
      │  │  • JWT utilities (verify, decode)
      │  ├─ backend:
      │  │  • Centralize auth middleware
      │  │  • Use shared schemas
      │  ├─ frontend:
      │  │  • Create AuthContext
      │  │  • Use shared schemas
      │  │  • Consolidate auth logic
      ├─ Creates shared code:
      │  • packages/common/src/auth/schemas.ts
      │  • packages/common/src/auth/jwt-utils.ts
      ├─ Delegates to backend:
      │  └─ Task(backend)
      │     └─ Agent: backend
      │        ├─ Creates auth middleware:
      │        │  • validateAuthToken using shared utils
      │        │  • getCurrentUser helper
      │        ├─ Refactors all routes:
      │        │  • Use auth middleware
      │        │  • Remove duplicated checks
      │        └─ Invokes: code-quality-enforcer
      └─ Delegates to frontend:
         └─ Task(frontend)
            └─ Agent: frontend
               ├─ Creates AuthContext:
               │  • Manages auth state
               │  • Uses shared schemas
               │  • Token refresh logic
               ├─ Creates useAuth hook:
               │  • Access auth state
               │  • Login/logout methods
               ├─ Refactors components:
               │  • Replace scattered auth checks
               │  • Use useAuth hook
               └─ Invokes: code-quality-enforcer
```

### Key Takeaways

- system-architect coordinates refactoring across domains
- Creates shared code first in packages/common
- Delegates specialized work to frontend and backend
- Ensures consistency and DRY principles

---

## Adding Tests

**Scenario:** User wants to add E2E tests for the post creation flow.

### User Invocation

```
User: Add E2E tests for creating posts - test with text, images, and validation errors
```

### Workflow

```
1. Invoke: test-expert
   └─ Agent: test-expert
      ├─ Analyzes feature:
      │  • Reads POST /posts API endpoint
      │  • Reads post-form frontend component
      │  • Identifies test scenarios
      ├─ Plans tests:
      │  • Happy path: Create post with text only
      │  • Happy path: Create post with text + image
      │  • Validation: Empty content (should fail)
      │  • Validation: Content too long (should fail)
      │  • Auth: Unauthenticated user (should fail)
      ├─ Creates E2E test:
      │  • e2e/tests/posts/create-post.spec.ts
      │  • Uses database snapshot for clean state
      │  • Tests all scenarios
      │  • Verifies post appears in feed
      │  • Checks database directly
      ├─ Creates fixtures:
      │  • e2e/fixtures/posts.ts (test data)
      │  • e2e/fixtures/images.ts (sample images)
      └─ Runs tests:
         • pnpm --filter @sound-connect/e2e test
         • Verifies all tests pass
         • Reports coverage
```

### Key Takeaways

- test-expert handles all testing work
- Creates comprehensive test scenarios
- Uses database snapshots for isolation
- Validates both UI and API behavior

---

## Summary: Quick Reference

| Task Type | Agent to Invoke | Auto-Delegates To |
|-----------|----------------|-------------------|
| New Feature | feature-spec-writer | designer, database-architect, system-architect/frontend/backend |
| Frontend Bug | frontend | code-quality-enforcer (auto) |
| Backend Bug | backend | code-quality-enforcer (auto) |
| Multi-Domain Bug | system-architect | frontend, backend |
| Database Schema | database-architect | backend |
| Refactoring (single app) | frontend or backend | code-quality-enforcer (auto) |
| Refactoring (multi-domain) | system-architect | frontend, backend |
| Testing | test-expert | (none) |
| Deployment | devops | (requires user approval) |

## Best Practices

1. **Always use feature-spec-writer for new features** - It ensures proper planning and coordination
2. **Let agents delegate automatically** - Don't manually invoke multiple agents in sequence
3. **Reference spec files** - When delegating, include the spec file path
4. **Use the right model** - Opus for planning/design, Sonnet for implementation
5. **Trust the workflow** - Agents know when to invoke code-quality-enforcer

## Common Mistakes to Avoid

❌ **Don't invoke system-architect for single-domain work**
- If it's frontend-only or backend-only, use those agents directly

❌ **Don't manually invoke code-quality-enforcer**
- frontend and backend agents do this automatically

❌ **Don't skip feature-spec-writer for new features**
- Even "simple" features benefit from proper specification

❌ **Don't invoke multiple agents manually**
- feature-spec-writer handles delegation automatically

✅ **Do start with feature-spec-writer for all new features**
✅ **Do use direct agents for bug fixes**
✅ **Do trust the auto-delegation workflow**
✅ **Do reference spec files when provided**
