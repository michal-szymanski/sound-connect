# Sound Connect - Social Media for Musicians

This project is a monorepo containing a social media app designed like LinkedIn but for musicians. People can connect with each other through music, allowing bands to find band members and vice versa. It includes typical social media features: chat between users, creating posts, comments, reactions, and notifications.

## Architecture

- **Frontend**: `apps/web` - Tanstack Start (95% Tanstack Router + extras), ShadCN, TailwindCSS, hosted on Cloudflare Workers
- **Backend**:
    - `apps/api` - REST API built with Cloudflare Workers, Durable Objects for real-time communication, Drizzle.js ORM with D1 database
    - `apps/posts-queue-consumer` - Queue consumer worker for content moderation, using Cloudflare Queues
    - `apps/notifications-queue-consumer` - Queue consumer worker for processing and delivering notifications, using Cloudflare Queues
- **Storage**:
    - `sound-connect-assets` - R2 bucket for user-uploaded media (profile images, band images, post media)
    - Public URL: `https://pub-fe5ef299f3464b73b8c54144ff278eae.r2.dev`
    - Accessible via `c.env.ASSETS` binding in API and queue consumers
- **Common**: `packages/common` - Shared types, constants, and utilities between frontend and backend

## API Communication Architecture

**CRITICAL: Frontend CANNOT make direct HTTP requests to the API worker.**

All API requests from the frontend (`apps/web`) to the backend (`apps/api`) MUST be routed through **Tanstack Start server functions** in `apps/web/src/shared/server-functions/`.

### Why Server Functions Are Required

- **Authentication**: Cookies are set on the web worker's domain and won't be sent in cross-origin requests to the API worker
- **Service Binding**: The web worker has a service binding (`env.API`) to the API worker that properly forwards authentication
- **Consistency**: All API calls follow the same pattern with proper error handling and type safety

### Architecture Flow

```
✅ CORRECT:
Browser → Server Function (Web Worker) → Service Binding → API Worker

❌ WRONG (will fail in production):
Browser → Direct XHR/Fetch → API Worker
```

### WebSocket Exception

WebSocket connections are the ONLY exception to this rule. The frontend CAN connect directly to the API's WebSocket endpoints because:
- WebSockets use token-based authentication (JWT in subprotocol header)
- WebSocket upgrade happens via HTTP headers, not cookies
- Durable Objects require direct WebSocket connections

```typescript
// ✅ WebSocket connections are allowed
const ws = new WebSocket('wss://api.example.com/ws', ['access_token', token]);
```

### Implementation Pattern

When adding a new API endpoint:

1. **Create the API route** in `apps/api/src/routes/`
2. **Create a server function** in:
   - `apps/web/src/features/{feature-name}/server-functions/` for feature-specific endpoints
   - `apps/web/src/shared/server-functions/` for shared/cross-feature endpoints
3. **Call the server function** from your frontend hooks/components

**Example:**

```typescript
// apps/web/src/shared/server-functions/my-feature.ts
export const myApiCall = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator(myRequestSchema)
    .handler(async ({ data, context: { env, auth } }) => {
        const response = await env.API.fetch(`${env.API_URL}/api/my-endpoint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(auth.cookie && { Cookie: auth.cookie })
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            return await apiErrorHandler(response);
        }

        const json = await response.json();
        return success(myResponseSchema.parse(json));
    });
```

**Never do this:**

```typescript
// ❌ WRONG - Direct fetch from client component
const response = await fetch('https://api.example.com/api/endpoint', {
    method: 'POST',
    credentials: 'include',  // Won't work cross-origin!
    body: JSON.stringify(data)
});
```

## Quick Reference

### Development Servers

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000` (includes posts-queue-consumer)

### Test Users

| Email                        | Password | Username | Role  | Name              |
| ---------------------------- | -------- | -------- | ----- | ----------------- |
| t1@asd.asd                   | aaaaaaaa | -        | -     | t1                |
| t2@asd.asd                   | aaaaaaaa | -        | -     | t2                |
| pw1@test.test                | Test123! | -        | -     | Playwright User 1 |
| pw2@test.test                | Test123! | -        | -     | Playwright User 2 |
| michal.szymanski92@gmail.com | admin    | admin    | admin | Admin             |

Seeded via: `pnpm db:seed:local` (defined in `packages/drizzle/src/seed.ts`)

**Admin Dashboard**: `http://localhost:3001` - Login with **username** `admin` and password `admin`

**Note**: The `role`, `banned`, `banReason`, and `banExpires` fields are managed automatically by better-auth's `admin()` plugin. Do not add these to `user.additionalFields` as this will conflict with the plugin's management.

## Implemented Features

For detailed information about each feature, see the feature-level documentation:

- **[Authentication](apps/web/src/features/auth/CLAUDE.md)** - Sign up, sign in, session management
- **[User Profiles](apps/web/src/features/profile/CLAUDE.md)** - Rich musician profiles with 30+ fields, inline editing, completion tracking
- **[Onboarding](apps/web/src/features/onboarding/CLAUDE.md)** - 6-step guided profile setup for new users
- **[Musician Search](apps/web/src/features/search/CLAUDE.md)** - Advanced search with filters for instruments, genres, location, availability
- **[Bands](apps/web/src/features/bands/CLAUDE.md)** - Band profiles, members, followers, applications
- **[Band Discovery](apps/web/src/features/discovery/CLAUDE.md)** - Personalized band recommendations based on profile matching
- **[Posts & Feed](apps/web/src/features/posts/CLAUDE.md)** - Social feed with hybrid discovery algorithm, comments, reactions
- **[Chat](apps/web/src/features/chat/CLAUDE.md)** - Real-time direct messaging via WebSocket/Durable Objects
- **[Notifications](apps/web/src/features/notifications/CLAUDE.md)** - In-app and email notifications with queue-based processing
- **[Settings](apps/web/src/features/settings/CLAUDE.md)** - Account, privacy, notifications, data export

## Known Gaps / Future Features

### Medium Priority

- Profile views analytics
- Recommendations engine
- Advanced messaging (group chats, read receipts)
- Event/gig calendar
- Audio/video player for sharing music
- Reviews/endorsements system

## Development Rules

### Development Server Management

**IMPORTANT: Never start dev servers automatically**

- NEVER run `pnpm --filter @sound-connect/web dev` or `pnpm --filter @sound-connect/api dev` without explicit user request
- Before attempting any development work, ALWAYS check if servers are running:
    - Frontend should be on `http://localhost:3000` (or nearby port if 3000 is taken)
    - Backend should be on `http://localhost:4000`
- Check server status using: `lsof -ti:3000,4000` or by checking background Bash processes
- If servers are NOT running, ask the user: "The dev servers are not running. Would you like me to start them?"
- ONLY start servers after explicit user confirmation
- This prevents multiple conflicting server instances and port conflicts

### Code Quality Enforcement

Code quality is automatically enforced by the `code-quality-enforcer` agent. This agent validates all code changes against the rules below, runs automated checks (oxlint, oxfmt, TypeScript), and blocks completion until standards are met. Agents working on code should invoke the code-quality-enforcer AFTER writing code and BEFORE marking tasks complete.

**CRITICAL: Work is NOT complete until `pnpm code:check` passes with 0 errors and 0 warnings.** This command runs oxlint and TypeScript checks across the entire codebase. Even if your specific changes are correct, you must fix any violations introduced by your work or uncovered during development. The codebase must always remain in a clean, deployable state.

### Agent Workflow

Sound Connect uses specialized agents to handle different types of work. Use the correct agent entry point based on your task:

#### Decision Tree: Which Agent to Invoke?

```
What type of work are you doing?

├─ NEW FEATURE
│  └─ Invoke: feature-spec-writer
│     • Creates comprehensive specification
│     • Automatically delegates to:
│       - designer (if UI work)
│       - database-architect (if DB changes)
│       - system-architect (only if needs shared code/API contracts) OR
│       - frontend/backend directly (most cases - let them coordinate)
│
├─ UI/UX IMPROVEMENTS
│  └─ Invoke: designer
│     • Provides UI/UX recommendations
│     • After designer responds, ask user: "Should I implement these improvements?"
│     • On user agreement (yes/continue/proceed/etc.) → Automatically invoke frontend
│     • Understand user intent, don't wait for specific keywords
│
├─ BUG FIX
│  ├─ Frontend bug → Invoke: frontend
│  │  • React components, hooks, server functions, routing, UI issues
│  │  • Tanstack Query configuration, data fetching
│  │  • Form validation, state management
│  │  • NEVER fix frontend bugs directly - ALWAYS use frontend agent
│  ├─ Backend bug → Invoke: backend
│  │  • API routes, database queries, Durable Objects
│  │  • NEVER fix backend bugs directly - ALWAYS use backend agent
│  └─ Multi-domain bug → Invoke: frontend or backend (they can coordinate)
│     • Only use system-architect if shared code needs updating
│
├─ DATABASE WORK
│  └─ Invoke: database-architect
│     • Designs schema
│     • After database-architect responds, ask user: "Should I implement these changes?"
│     • On user agreement → Automatically invoke backend
│
├─ DEPLOYMENT / OPERATIONS / INFRASTRUCTURE
│  └─ Invoke: devops
│     • CI/CD pipeline changes (.github/workflows/*.yml)
│     • Infrastructure config (wrangler.jsonc)
│     • Deployments and rollbacks
│     • Database migrations (production)
│     • Secret management
│     • Requires user approval
│     • ALWAYS invoke for infrastructure/deployment changes
│
├─ TESTING
│  └─ Invoke: test-expert
│     • E2E tests (Playwright)
│     • Integration tests
│     • Unit tests
│
└─ REFACTORING
   ├─ Single app → Invoke: frontend or backend
   └─ Cross-cutting → Invoke: frontend or backend (they can coordinate)
      • Only use system-architect if refactoring packages/common
```

#### Agent Descriptions

**feature-spec-writer** - Creates detailed specifications for new features

- **Use when:** User requests a NEW feature ("add", "implement", "create", "build")
- Asks clarifying questions, writes spec to `/specs/`, auto-delegates to other agents

**designer** - UI/UX and accessibility advisor (does NOT implement)

- **Use when:** UI design decisions, layout improvements, accessibility reviews, component recommendations
- **Skills:** `frontend-design`
- After response → ask user approval → invoke frontend

**database-architect** - Designs database schemas and migrations (does NOT implement)

- **Use when:** New tables, schema changes, query optimization, indexing decisions
- After response → ask user approval → invoke backend

**system-architect** - Coordinates multi-domain features (frontend + backend + shared code)

- **Use when:** Feature needs shared types/schemas in `packages/common` OR API contract coordination
- NOT for single-domain work - use frontend or backend directly

**frontend** - Implements frontend code in `apps/web/`

- **Use when:** ANY frontend work (features, bugs, refactors) - even "simple" fixes
- **Skills:** `frontend-design`
- Auto-invokes code-quality-enforcer

**backend** - Implements backend code in `apps/api/` and queue consumers

- **Use when:** ANY backend work (API routes, queries, Durable Objects, queues)
- Auto-invokes code-quality-enforcer

**realtime-architect** - Implements real-time features

- **Use when:** Chat, live notifications, presence, typing indicators, real-time updates

**devops** - Handles deployments, migrations, CI/CD, infrastructure

- **Use when:** Production deployments, database migrations, wrangler.jsonc, GitHub Actions, secrets
- Requires user approval for ALL operations

**test-expert** - Plans and implements tests

- **Use when:** E2E tests (Playwright), integration tests, unit tests
- Adding test coverage for new or existing features

**code-quality-enforcer** - Validates code against CLAUDE.md rules

- **Do not invoke manually** - called automatically by frontend/backend agents

#### Two-Step Workflows (Advisory → Implementation)

**Advisory agents** (designer, database-architect) provide recommendations but do NOT implement. After they respond:

1. Ask user: "Should I implement these changes?"
2. On affirmative response → automatically invoke frontend/backend
3. If user provides feedback → loop back to advisory agent first

#### Example Workflows

**Example 1: New Feature (Post Editing)**

```
User: "Add post editing feature"
  ↓
Invoke: feature-spec-writer
  ↓
feature-spec-writer:
  1. Asks clarifying questions
  2. Writes spec to /specs/post-editing.md
  3. Auto-delegates:
     - Task(designer) → UI guidance
     - Task(system-architect) → Coordination
       - Creates shared types in packages/common
       - Defines API contract (PUT /posts/:id)
       - Task(backend) → "Implement PUT /posts/:id per spec. Use your expertise."
       - Task(frontend) → "Implement edit UI per spec + designer guidance. Use your expertise and MCPs."
```

**Example 2: Bug Fix**

```
User: "Fix broken profile image upload"
  ↓
Invoke: frontend (if frontend bug) or backend (if API bug)
  ↓
Agent fixes bug and auto-invokes code-quality-enforcer
```

**Example 3: UI/UX Improvement (Two-Step Workflow)**

```
User: "Improve the profile page UI"
  ↓
Invoke: designer
  ↓
designer:
  Provides comprehensive UI/UX recommendations
  ↓
Assistant: "Should I implement these improvements?"
  ↓
User: "yes" (or "proceed" / "continue" / "sure" / "go ahead" / etc.)
  ↓
Automatically invoke: frontend
  ↓
frontend:
  Implements all UI improvements
  Auto-invokes code-quality-enforcer
  ↓
Done!
```

#### Key Principles

1. **Always start with feature-spec-writer for new features** - It handles the entire workflow automatically
2. **Follow two-step workflows for advisory agents** - After designer or database-architect responds, proactively ask if user wants implementation, then automatically invoke frontend/backend on any affirmative response. Understand intent, not keywords.
3. **system-architect is coordination-focused, not prescriptive** - It creates shared code and defines contracts, then lets domain agents use their expertise and MCPs
4. **Use system-architect only for multi-domain features** - Skip it for frontend-only or backend-only work
5. **Don't invoke code-quality-enforcer manually** - frontend/backend agents do this automatically
6. **Trust domain agents** - Frontend and backend agents have specialized knowledge and access to MCPs (Magic UI, etc.). Let them make implementation decisions.
7. **Parallelize agent execution whenever possible** - Invoke independent agents simultaneously using multiple Task calls in a single message to minimize total execution time

#### Parallel Agent Execution

To speed up feature implementation, invoke agents **in parallel** when they don't depend on each other's outputs.

**How to Invoke Agents in Parallel:**
Use multiple Task tool calls in a **single message**:

```
Task(system-architect, "Create shared types")
Task(database-architect, "Design schema")
Task(designer, "Create UI recommendations")
```

All three agents execute simultaneously, reducing total time from 15 minutes (sequential) to 5 minutes (parallel).

**Optimal Parallel Workflow for Multi-Domain Features:**

```
Phase 1: Specification (Sequential - Required First)
  feature-spec-writer (5 min)
    ↓
Phase 2: Design & Architecture (Parallel)
  system-architect + database-architect + designer (5 min parallel)
    ↓
Phase 3: Implementation (Parallel, after Phase 2 completes)
  backend + frontend (10 min parallel)
    ↓
Phase 4: Validation (Parallel, after Phase 3 completes)
  test-expert + code-quality-enforcer (5 min parallel)

Total: ~25 minutes (vs 35+ sequential)
```

**Dependency Rules:**

- **Phase 2 agents** (system-architect, database-architect, designer) can run in parallel - they produce independent outputs
- **Phase 3 agents** (backend, frontend) can run in parallel IF:
    - They both need system-architect's types → wait for Phase 2
    - They coordinate via shared types (no direct file conflicts)
- **Phase 4 agents** (test-expert, code-quality-enforcer) can run in parallel - they validate completed code

**Example Sequential vs Parallel:**

_Sequential (old way):_

```
1. feature-spec-writer → 5 min
2. system-architect → 3 min
3. database-architect → 3 min
4. designer → 3 min
5. backend → 10 min
6. frontend → 10 min
Total: 34 minutes
```

_Parallel (new way):_

```
1. feature-spec-writer → 5 min
2. system-architect + database-architect + designer → 5 min (parallel)
3. backend + frontend → 10 min (parallel)
Total: 20 minutes (41% faster!)
```

**When NOT to Parallelize:**

- frontend/backend agents editing the same files (rare, but possible)
- Agent B needs Agent A's output immediately (create dependency chain)
- Advisory agents (designer, database-architect) that inform implementation decisions

**Implementation Note:**
When user requests a feature, proactively identify parallel opportunities and invoke agents simultaneously to minimize total execution time.

#### CRITICAL: Never Make Direct Code Changes

**ABSOLUTE RULE: You must NEVER directly edit code files in `apps/web/`, `apps/api/`, `apps/*-queue-consumer/` using Edit, Write, or other tools.**

When you identify an issue or need to implement a feature:

1. **Frontend issues** (`apps/web/**`): ALWAYS invoke `frontend` agent
    - Server functions, React hooks, components, routing, Tanstack Query
    - Even for "simple" fixes like adding a parameter or fixing a condition
2. **Backend issues** (`apps/api/**`, `apps/*-queue-consumer/**`): ALWAYS invoke `backend` agent
    - API routes, database queries, Durable Objects, queue consumers
    - Even for "simple" fixes like adding validation or fixing logic

**Why this matters:**

- Specialized agents have deep domain knowledge and access to specialized MCPs
- They automatically run code quality checks
- They follow framework-specific best practices
- They maintain consistency across the codebase

**When direct editing IS allowed:**

- Documentation files (`.md`)
- Configuration files (only when not part of feature implementation)
- Shared code in `packages/common` (only when coordinating with system-architect)

**Examples of what NOT to do:**

- ❌ "Let me fix this React Query hook configuration" → Edit tool
- ❌ "I'll add the missing method parameter" → Edit tool
- ❌ "Let me update this API route" → Edit tool

**Examples of what TO do:**

- ✅ "Let me invoke the frontend agent to fix this React Query hook configuration" → Task(frontend)
- ✅ "Let me invoke the frontend agent to add the missing method parameter" → Task(frontend)
- ✅ "Let me invoke the backend agent to update this API route" → Task(backend)

### General AI Rules (Apply to All Projects)

- NEVER generate comments within the code. No exceptions.
- ALWAYS generate types instead of interfaces unless technically impossible (e.g., declaration merging in `declare module` blocks).
- Connection with durable objects should be done with semantic function names and synthetic request should not be passed to "fetch" function unless necessary.
- File names MUST be kebab-case.
- NEVER modify files with name "worker-configuration.d.ts". These are Cloudflare files generated by the command "pnpm run types". This command should be executed any time some wrangler.jsonc file changes.
- NEVER create, modify, or override any `.env*` or `.dev.vars*` files. These files contain sensitive secrets and environment variables. If changes to environment files are needed, ALWAYS ask the user to manually update them and provide the exact content they should add/modify.
- When creating typescript props type ALWAYS use name "Props".
- Every payload MUST be validated with the same zod schema on frontend before sending and on backend after receiving it.
- Code (functions, variables, etc.) can be exported ONLY if it's imported somewhere else, unless this is related to frameworks and libraries (e.g., React components, API route handlers, worker exports). Code used only internally within the same file should NOT be exported.
- In try-catch blocks, if the error is not used in the catch block, omit the error parameter entirely. Use `catch { }` instead of `catch (_error) { }` or `catch (error) { }`.
- ALWAYS use `pnpm` as the package manager. NEVER use `npm` or `npx`. Use `pnpm exec` to run executables from installed packages (e.g., `pnpm exec playwright test`, `pnpm exec oxlint`). Use `pnpm dlx` for one-off command execution without installation.
- Before making any edit, check if it violates these rules.
- If a rule conflict arises, ask the user for clarification rather than breaking the rule.

### App-Specific Rules

For frontend patterns (React, TypeScript, ShadCN, TanStack), see:

- **react** skill - Component patterns, hooks, forms, file organization
- **typescript** skill - Type conventions, Zod patterns, enum definitions
- **shadcn-ui** skill - UI components, z-index system, form components
- **magic-ui** skill - Enhanced animations, text effects, special effects, interactive components
- **tanstack** skill - Router, Query, Start patterns (file-based routing, server functions)

For backend patterns (Hono, Cloudflare, Database), see:

- **hono** skill - API routes, middleware, validation, error handling
- **cloudflare** skill - Workers, D1, R2, Durable Objects, Queues
- **database-design** skill - Drizzle schema, migrations, query patterns

For design and branding:

- **branding** skill - Visual identity, color palette, terminology, voice
- **frontend-design** skill - Sound Connect UI patterns, Magic UI components

#### Better Auth Configuration

**CRITICAL: Custom Users Table Columns**

When adding new columns to the `users` table in `packages/drizzle/src/better-auth.ts`, you MUST also add them to better-auth's `user.additionalFields` configuration in `apps/api/auth.ts`. This ensures the fields are included in authentication session responses.

**Example:**

1. Add column to schema (`packages/drizzle/src/better-auth.ts`):
```typescript
export const users = sqliteTable('users', {
    // ... existing fields
    backgroundImage: text('background_image'),
});
```

2. Add to better-auth config (`apps/api/auth.ts`):
```typescript
user: {
    additionalFields: {
        backgroundImage: {
            type: 'string',
            required: false,
            input: false
        }
    }
}
```

**Why this matters:**
- Without additionalFields configuration, new columns won't appear in `auth.user` responses
- Frontend components relying on reactive auth data will not receive the new fields
- API server must be restarted after modifying `auth.ts` for changes to take effect

**Recent examples:**
- `backgroundImage` field added for profile cover images (apps/web/src/features/profile/CLAUDE.md)

#### Database Schema & Migration Management

**CRITICAL: Automated Schema Generation - DO NOT Edit Schema Files Manually**

**Better Auth Schema (`packages/drizzle/src/better-auth.ts`):**

Changes to `packages/drizzle/src/better-auth.ts` should ONLY be done via the `auth:generate` script:

```bash
pnpm --filter @sound-connect/api auth:generate
```

**When to run this script:**
- After ANY changes to the `createAuth` function in `apps/api/src/better-auth/auth.ts`
- After modifying plugins, user.additionalFields, or database hooks in better-auth config
- The script reads your better-auth configuration and auto-generates the correct schema

**Application Schema (`packages/drizzle/src/schema.ts`):**

After making changes to `packages/drizzle/src/schema.ts`, you MUST run:

```bash
pnpm --filter @sound-connect/drizzle db:generate
```

This generates Drizzle migration files based on schema changes.

**Custom Migrations (Triggers, Indexes, Raw SQL):**

For custom SQL that Drizzle schema doesn't support (triggers, indexes, complex queries), use:

```bash
pnpm --filter @sound-connect/drizzle db:generate:custom
```

This creates an empty migration file where you can add custom SQL. The file will be created in `packages/drizzle/migrations/` with a timestamp prefix.

**Migration Workflow:**

1. **Modify schema** → `packages/drizzle/src/schema.ts`
2. **Generate migration** → `pnpm --filter @sound-connect/drizzle db:generate`
3. **Review migration** → Check generated SQL in `packages/drizzle/migrations/`
4. **Apply to local DB** → `pnpm db:migrate:local` (from root or apps/api)
5. **Apply to production** → Invoke `devops` agent (requires user approval)

**PROHIBITED:**
- ❌ Manually editing `packages/drizzle/src/better-auth.ts` (use `auth:generate` instead)
- ❌ Manually creating migration files (use `db:generate` or `db:generate:custom`)
- ❌ Editing generated migration files (regenerate if schema is wrong)
- ❌ Applying production migrations without user approval (invoke `devops` agent)

**Why this matters:**
- Manual edits to better-auth schema will be overwritten by `auth:generate`
- Manual migration creation causes timestamp conflicts and migration ordering issues
- Drizzle relies on accurate schema representation to generate correct migrations
- Production migrations are irreversible and require careful review

#### R2 Asset Storage (`sound-connect-assets`)

**Current Setup:**

- Bucket name: `sound-connect-assets`
- Binding: `ASSETS` (accessible via `c.env.ASSETS` in API and queue consumers)
- No egress fees (Cloudflare R2's key advantage over S3)
- **All media is proxied through `/media/*` route** (not accessed directly from R2)

**Upload Flow (Hybrid Approach):**

_Modern Flow (Presigned URLs - Recommended):_

1. **Request:** Client calls `POST /api/uploads/presigned-url` with file metadata
    - Backend validates auth, file type, size limits
    - Creates `upload_session` in database
    - Returns: uploadUrl, sessionId, tempKey, expiresAt
2. **Upload:** Client uploads directly to `POST /api/uploads/upload?sessionId={id}`
    - File streams to R2 `temp/` folder (bypasses Worker for file transfer)
    - Progress tracking on client
    - Presigned URL expires in 15 minutes
3. **Confirm:** Client calls `POST /api/uploads/confirm` with sessionId and key
    - Backend validates file exists, matches size/type
    - Validates file type via magic numbers (JPEG, PNG, WebP, GIF, MP4, WebM, MOV)
    - Moves from `temp/{userId}/{timestamp}-{uuid}.{ext}` to permanent location
    - Returns publicUrl and permanent key
4. **Cleanup:** R2 lifecycle rule auto-deletes `temp/` files after 24 hours

_Legacy Flow (Through-API - For backward compatibility):_

- Client uploads via `POST /posts` (with media) or `PUT /media`
- API receives file and uploads to R2 using `c.env.ASSETS.put(key, file)`
- Optional: Queue consumer processes for moderation (future AI moderation)

**Media Proxy:**

All uploaded files are served through the `/media/*` proxy route, not directly from R2:
- Frontend route: `apps/web/src/routes/media/$.ts` - Catches all `/media/*` requests
- Forwards to backend: `GET /api/media/{key}` (`apps/api/src/routes/media.ts`)
- Backend fetches from R2 and serves with proper headers and caching
- Public URL format: `{CLIENT_URL}/media/{key}` (e.g., `http://localhost:3000/media/profiles/userId/avatar.jpg`)
- Enables future features: authentication, resizing, watermarking, analytics

**Folder Structure:**

```
sound-connect-assets/
├── temp/           # Temporary uploads (lifecycle: auto-delete after 24hrs)
├── profiles/       # User profile images (profiles/{userId}/avatar.{ext})
├── bands/          # Band profile images (bands/{bandId}/avatar.{ext})
└── posts/          # Post media (posts/{postId}/image-{n}.{ext})
```

**Upload API Endpoints:**

- `POST /api/uploads/presigned-url` - Request upload session (returns uploadUrl, sessionId, key)
- `POST /api/uploads/upload?sessionId={id}` - Streaming proxy upload to R2
- `POST /api/uploads/confirm` - Validate and move single file to permanent location
- `POST /api/uploads/confirm-batch` - Validate and move multiple files (for post media)
- `POST /api/uploads/cleanup` - Cron endpoint to cleanup expired sessions

**Frontend Upload Components:**

- `ProfileImageUpload` - Circular avatar upload with preview (`apps/web/src/features/profile/components/`)
- `BandImageUpload` - Square band image upload (`apps/web/src/features/bands/components/`)
- `PostMediaUpload` - Multi-file grid upload, up to 5 files (`apps/web/src/features/posts/components/`)
- Hooks: `usePresignedUpload` (single file), `useBatchPresignedUpload` (multiple files)

**Key Patterns:**

- Use `crypto.randomUUID()` for generating unique object keys
- Store R2 object keys in database (not full URLs)
- Construct public URLs when needed: `${PUBLIC_R2_URL}/${key}`
- All uploaded files are public by default (no presigned URLs needed for read access)
- File size limits: 10MB for images, 100MB for videos
- Allowed types: JPEG, PNG, WebP, GIF (images); MP4, WebM, MOV (videos)
- Upload sessions expire after 15 minutes (presigned URL) or 1 hour (upload window)

**Implemented Features:**

- ✅ Presigned URL uploads (streaming proxy to R2)
- ✅ Upload session tracking in database
- ✅ File validation (size, type, magic numbers)
- ✅ Automatic cleanup via R2 lifecycle rules (temp/ folder, 24 hours)
- ✅ Progress tracking on client
- ✅ Batch uploads for post media (up to 5 files)

**Future Enhancements:**

- AI-based content moderation in queue consumer (validate uploads before moving to permanent location)
- Image optimization and resizing (create thumbnails, convert to WebP)
- Video transcoding (convert to optimized formats)
- Resumable uploads for large files (multipart uploads)

**Database:**

- `upload_sessions` table tracks presigned URL requests and confirmations
- Columns: id, user_id, upload_type, band_id, file_name, file_size, content_type, temp_key, expires_at, created_at, confirmed_at
- Indexed on user_id, expires_at, confirmed_at for efficient queries
- Migration: `0010_add_upload_sessions.sql`

**Legacy:**

- Old bucket `users-bucket` (binding: `UsersBucket`) - kept as backup, not used in code
- Migration completed: 2025-11-10
- Presigned upload system implemented: 2025-11-10

#### Queue Consumers (`apps/posts-queue-consumer` and `apps/notifications-queue-consumer`)

- Always handle errors gracefully to prevent message loss
- Log all processing decisions for audit purposes
- Use structured logging for better observability
- Validate all queue messages with Zod schemas before processing

## Monorepo Structure

- **Frontend**:
    - `apps/web` - Web application
- **Backend**:
    - `apps/api` - API server
    - `apps/posts-queue-consumer` - Queue consumer for post moderation
    - `apps/notifications-queue-consumer` - Queue consumer for notifications processing
- **Testing**:
    - **[E2E Tests](e2e/CLAUDE.md)**: `e2e` - Playwright end-to-end tests with database snapshots
- **Shared**:
    - `packages/common` - Shared utilities and types
    - `packages/drizzle` - Drizzle ORM schema definitions and database migrations for D1
