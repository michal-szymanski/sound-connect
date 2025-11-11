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

## Quick Reference

### Development Servers

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000` (includes posts-queue-consumer)

### Test Users

| Email      | Password | Name |
| ---------- | -------- | ---- |
| t1@asd.asd | aaaaaaaa | t1   |
| t2@asd.asd | aaaaaaaa | t2   |

Defined in: `packages/drizzle/migrations/0001_seed_users.sql`

## Implemented Features

### Authentication & User Management
- Sign up / Sign in (better-auth)
- Session management
- User accounts

### User Profiles
- **Rich musician profiles** with 30+ fields:
  - **Instruments**: Primary instrument, years playing, up to 4 additional instruments, "seeking to play" preferences
  - **Genres**: Primary genre, secondary genres (44 genre options)
  - **Availability Status**: 4-tier system with color-coded indicators
    - Actively Looking (green, with expiration date)
    - Open to Offers (blue)
    - Not Looking (gray)
    - Just Browsing (yellow)
  - **Experience**: Years playing, commitment level (hobbyist/serious amateur/professional), past bands, studio experience, gigging level
  - **Location**: City, state, country (geocoded with lat/long), travel radius
  - **Availability**: Weekly availability schedule, rehearsal frequency preference
  - **Logistics**: Rehearsal space, transportation
  - **Goals**: Bio, musical influences, seeking, can offer, deal breakers, musical goals, age range
- **Profile completion tracking**: 0-100% score with visual progress indicator
- **Inline profile editing**: All sections editable directly on profile page
- Follow/unfollow users
- View followers and following lists
- Follow request system

### Musician Discovery
- **Advanced search** at `/musicians`:
  - Filter by instruments (multi-select, searches primary + additional)
  - Filter by genres (multi-select, searches primary + secondary)
  - Filter by location with radius (5, 10, 25, 50, 100 miles)
  - Filter by availability status (multi-select)
  - Geocoding with fallback to city name matching
  - Distance calculation (haversine formula)
  - Results sorted by instrument match + last active
  - Pagination (12 results per page)
- Profile cards showing key musician info
- User detail pages with full profile information

### Band/Group Management
- **Create bands** (`/bands/new`) with profile information:
  - Name, bio, profile image
  - Primary genre
  - Location (geocoded)
  - "Looking for" section (prominently displayed)
- **Band profile pages** (`/bands/:id`) with tabbed interface:
  - Posts tab: Band posts feed, post composer (admin only)
  - About tab: Bio, "Looking for" section (highlighted), delete band (admin only)
  - Members tab: Member grid with roles, add/remove members (admin only)
- **Member management**:
  - Add/remove members (admin only)
  - Admin role system (multiple admins per band)
  - Protection: Last admin cannot be removed
  - Member cards showing name, profile image, admin badge
- **Band posts**: Admins can create posts on behalf of band
- **Follow bands**: Follow/unfollow button on band profiles
- **Band followers**:
  - Follower count display on profile
  - Followers modal showing list of followers
  - Message band button (starts conversation with band admins)
- **My Bands page** (`/bands`): View all bands user belongs to (sorted by admin status)
- **"Find Musicians" CTA**: Band profiles have quick link to musician search pre-filled with band's location and genre
- **Band applications**:
  - Musicians can apply to join bands with "looking for" section
  - Application form with message, position (optional), and music link (optional)
  - Applications tab on band page (visible to admins only) with pending count badge
  - Accept/reject workflow with confirmation dialogs
  - Rejection feedback message (optional)
  - Prevents re-application after rejection during current recruitment period
  - Prevents duplicate applications (one pending per band)
  - Notifications sent to band admins when application received
  - Notifications sent to applicants when accepted/rejected
  - Apply button shows status: "Apply", "Application Pending", or "Application Declined"
  - Auto-adds accepted applicants as band members

### Band Discovery
- **Intelligent band matching** at `/discover/bands`:
  - Personalized recommendations based on user profile
  - Smart matching algorithm scores bands by:
    - Instrument match (50 points for primary instrument, 25 for additional instruments)
    - Genre match (30 points for primary genre, 15 for secondary genres)
    - Location proximity (20 points < 10 miles, 10 points < 25 miles, 5 points < 50 miles)
  - Only shows bands with "looking for" text (actively recruiting)
  - Minimum match score of 20 required
  - Results sorted by match score (highest first)
  - Shows top 2 match reasons per band (instrument, genre, location)
  - Displays distance in miles, follower count, member count
  - Pagination (12 results per page)
  - Analytics tracking (page views, card clicks, profile views)
  - Graceful handling of incomplete profiles:
    - Shows friendly Card UI prompting profile completion
    - Requires: primary instrument, primary genre, city
    - Button navigates to user's own profile for inline editing
- **Band search** at `/bands/search`:
  - Filter by genre
  - Filter by location with radius (5, 10, 25, 50, 100 miles)
  - Filter by "looking for" text search
  - Distance calculation
  - Shows member count
  - Pagination (12 results per page)
- My Bands page (`/bands`) showing all bands user belongs to

### Social Features
- **Posts**:
  - Create posts (text, images, videos)
  - Posts by users or bands (author_type: 'user' | 'band')
  - View post detail pages
  - Social feed on home page
- **Reactions**: React to posts
- **Comments**: Comment on posts
- **User search**: Basic user search functionality

### Real-time Communication
- **Direct messaging** at `/messages`:
  - 1:1 conversations
  - Real-time message delivery (Durable Objects)
  - Message history
  - Conversation list with search
  - Emoji picker in message input
  - Quick access via right sidebar "Messages" card

### Notifications
- Notification system
- Queue-based notification processing (Cloudflare Queues)

### Content Moderation
- Queue-based content moderation for posts (Cloudflare Queues)

### User Settings
- **Settings page** at `/settings` with tabbed interface:
  - **Account tab**: Update email address, change password, view account creation date
  - **Privacy tab**:
    - Profile visibility control (public, followers only, private)
    - Search visibility toggle (appear in musician search)
    - Who can message me (anyone, followers only, no one)
    - Who can follow me (anyone, approval required, no one)
    - Block/unblock users with blocked users list management
  - **Notifications tab**:
    - Global email notifications toggle
    - Granular controls per notification type (follows, comments, reactions, mentions, band applications)
    - In-app notifications always enabled
  - **Data & Account tab**:
    - Export all user data in JSON format (profile, posts, comments, messages, bands)
    - Delete account with password confirmation
- **Privacy enforcement**:
  - Profile visibility respected across the platform
  - Search visibility excludes users from musician search results when disabled
  - Blocked users cannot view profile, send messages, or see content in feed
  - Messaging and follow permissions enforced on all interactions

## Known Gaps / Future Features

### High Priority (Affects Activation & Retention)
- **Onboarding flow**: No guided profile setup for new users after sign-up
- **Discovery feed**: No personalized "For You" feed - users must manually search
- **Saved profiles**: Cannot bookmark musicians/bands for later

### Medium Priority
- Profile views analytics
- Recommendations engine
- Advanced messaging (group chats, read receipts)
- Event/gig calendar
- Audio/video player for sharing music
- Reviews/endorsements system

## Development Rules

### Code Quality Enforcement

Code quality is automatically enforced by the `code-quality-enforcer` agent. This agent validates all code changes against the rules below, runs automated checks (Prettier, ESLint, TypeScript), and blocks completion until standards are met. Agents working on code should invoke the code-quality-enforcer AFTER writing code and BEFORE marking tasks complete.

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

**feature-spec-writer** (Entry point for new features)

- Transforms vague ideas into detailed specifications
- Asks clarifying questions
- Creates `/specs/[feature-name].md` file
- Automatically delegates to appropriate agents
- Use when: Building any new feature

**designer**

- Provides UI/UX guidance
- ShadCN component recommendations
- Accessibility considerations (WCAG 2.1 AA)
- Invoked by: feature-spec-writer (automatic)

**database-architect**

- Designs database schemas
- Plans migrations
- Optimizes queries and indexes
- Invoked by: feature-spec-writer (automatic) or user directly

**system-architect**

- Creates shared code in `packages/common` (Zod schemas, types, utilities)
- Defines API contracts between frontend and backend
- Ensures type safety across the stack
- Delegates to frontend/backend with **requirements**, not implementation details
- **Coordination-focused**: Let domain agents use their expertise and MCPs (Magic UI, etc.)
- Use when: Multi-domain feature needs shared code or API contract coordination
- DON'T use when: Feature is frontend-only or backend-only
- DON'T provide: Prescriptive implementation guides, code examples, component choices

**frontend**

- Tanstack Start implementation
- React components and server functions
- Tanstack Query hooks
- Auto-invokes code-quality-enforcer
- Use when: Frontend-only features or frontend portion of multi-domain
- **CRITICAL**: ALWAYS invoke for ANY frontend code changes (bugs, features, refactors)
- **NEVER** make direct edits to frontend files - delegate to frontend agent

**backend**

- Hono API routes
- Drizzle ORM queries
- Durable Objects
- Queue consumers
- Auto-invokes code-quality-enforcer
- Use when: Backend-only features or backend portion of multi-domain
- **CRITICAL**: ALWAYS invoke for ANY backend code changes (bugs, features, refactors)
- **NEVER** make direct edits to backend files - delegate to backend agent

**realtime-architect**

- WebSocket features
- Durable Objects for real-time
- Connection management
- Use when: Real-time features (chat, notifications, live updates)

**devops**

- Cloudflare Workers deployments
- Database migrations (production)
- Monitoring configuration
- CI/CD pipeline modifications (GitHub Actions workflows)
- Secret management (Cloudflare secrets, environment variables)
- Infrastructure configuration (wrangler.jsonc, deployment settings)
- Requires user approval for ALL operations
- **MUST be invoked for:**
  - Any changes to `.github/workflows/*.yml` files
  - Any changes to `wrangler.jsonc` files
  - Production deployments or rollbacks
  - Creating/updating/deleting Cloudflare secrets
  - Database migrations in production
  - Queue, Durable Object, or R2 bucket configuration changes
- Use when: Deployment, operational, or infrastructure tasks

**test-expert**

- E2E tests with Playwright
- Integration tests
- Unit tests
- Test organization and coverage
- Use when: Adding or fixing tests

**code-quality-enforcer**

- Validates CLAUDE.md compliance
- Runs Prettier, ESLint, TypeScript checks
- Invoked automatically by: frontend, backend
- DON'T invoke manually

#### Two-Step Workflows (Advisory → Implementation)

Some tasks require consultation with an advisory agent followed by automatic implementation:

**UI/UX Improvements Workflow:**
1. User requests UI improvement → Invoke **designer** agent
2. Designer provides comprehensive recommendations
3. **Assistant asks**: "Should I implement these improvements?"
4. **On any affirmative response** (yes/continue/proceed/sure/go ahead/do it/implement it/etc.) → **Automatically invoke frontend agent**
5. Frontend agent implements the recommendations

**Database Schema Changes Workflow:**
1. User requests database changes → Invoke **database-architect** agent
2. Database-architect provides schema design and migration plan
3. **Assistant asks**: "Should I implement these changes?"
4. **On any affirmative response** → **Automatically invoke backend agent**
5. Backend agent implements migrations

**Critical Rules for Two-Step Workflows:**
- After advisory agent completes, ALWAYS proactively ask user if they want implementation
- Detect user **intent**, not specific keywords - any affirmative response triggers implementation
- If user says "no" or asks questions → wait for clarification, don't implement
- If user provides feedback/changes → loop back to advisory agent first, then ask again
- DON'T wait passively for user to explicitly say "invoke frontend" or "use the agent"
- DON'T start implementing with direct tool use (Edit, Write) - always use the appropriate implementation agent

**Advisory Agents:**
- `designer` → provides UI/UX guidance → followed by `frontend` implementation
- `database-architect` → provides schema design → followed by `backend` implementation

**Implementation Agents:**
- `frontend` → implements UI changes, React components, Tanstack Start features
- `backend` → implements API routes, database migrations, Durable Objects

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

**Example 2: Frontend-Only Feature (Dark Mode)**

```
User: "Add dark mode toggle"
  ↓
Invoke: feature-spec-writer
  ↓
feature-spec-writer:
  1. Asks clarifying questions
  2. Writes spec to /specs/dark-mode.md
  3. Auto-delegates:
     - Task(designer) → Color palette, toggle design
     - Task(frontend) → Implementation (skip system-architect)
```

**Example 3: Bug Fix**

```
User: "Fix broken profile image upload"
  ↓
Invoke: frontend (if frontend bug) or backend (if API bug)
  ↓
Agent fixes bug and auto-invokes code-quality-enforcer
```

**Example 4: Database Change**

```
User: "Add indexes for post queries"
  ↓
Invoke: database-architect
  ↓
database-architect:
  1. Analyzes query patterns
  2. Designs indexes
  3. Delegates to backend for migration
```

**Example 5: UI/UX Improvement (Two-Step Workflow)**

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

**Example 6: UI/UX Improvement with Feedback**

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
User: "Can you also add dark mode support?"
  ↓
Loop back to designer with additional requirements
  ↓
designer:
  Provides updated recommendations including dark mode
  ↓
Assistant: "Should I implement these improvements?"
  ↓
User: "yes"
  ↓
Automatically invoke: frontend
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

*Sequential (old way):*
```
1. feature-spec-writer → 5 min
2. system-architect → 3 min
3. database-architect → 3 min
4. designer → 3 min
5. backend → 10 min
6. frontend → 10 min
Total: 34 minutes
```

*Parallel (new way):*
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
- When creating typescript props type ALWAYS use name "Props".
- Every payload MUST be validated with the same zod schema on frontend before sending and on backend after receiving it.
- Code (functions, variables, etc.) can be exported ONLY if it's imported somewhere else, unless this is related to frameworks and libraries (e.g., React components, API route handlers, worker exports). Code used only internally within the same file should NOT be exported.
- In try-catch blocks, if the error is not used in the catch block, omit the error parameter entirely. Use `catch { }` instead of `catch (_error) { }` or `catch (error) { }`.
- ALWAYS use `pnpm` as the package manager. NEVER use `npm` or `npx`. Use `pnpm exec` to run executables from installed packages (e.g., `pnpm exec playwright test`, `pnpm exec eslint`). Use `pnpm dlx` for one-off command execution without installation.
- Before making any edit, check if it violates these rules.
- If a rule conflict arises, ask the user for clarification rather than breaking the rule.

### App-Specific Rules

#### Frontend (`apps/web`)

- NEVER modify files in `src/components/ui/` - these are ShadCN auto-generated components

**Z-Index System:**

Sound Connect uses a centralized z-index system defined in Tailwind configuration to ensure consistent layering across the application.

**Available Tokens:**
- `z-base` (0) - Default layer for normal content
- `z-dropdown` (1) - Dropdown menus (not popovers)
- `z-sticky` (10) - Sticky headers and navigation
- `z-sidebar` (60) - Sidebar navigation (main layout)
- `z-dialog` (100) - Dialog/modal overlays
- `z-popover` (110) - Popover components (emoji picker, tooltips)
- `z-tooltip` (120) - Tooltip overlays (highest priority)

**Usage:**
```tsx
<div className="z-popover">...</div>
<div className="z-tooltip">...</div>
```

**Rules:**
- ALWAYS use semantic z-index tokens (e.g., `z-popover`) instead of numeric values (e.g., `z-[110]`)
- NEVER use arbitrary z-index values like `z-[999]` or `z-50` unless adding to the token system
- Tooltips must use `pointer-events-none` to prevent hover interference
- If a new layering level is needed, add it to the Tailwind config and document it here

**Defined in:**
- CSS variables: `apps/web/src/styles/globals.css:170-177`
- Tailwind config: `apps/web/tailwind.config.ts` (theme.extend.zIndex)

#### Backend API (`apps/api`)

- ALWAYS access current user ID with `c.get('user')` - NEVER trust user IDs from frontend requests

#### R2 Asset Storage (`sound-connect-assets`)

**Current Setup:**
- Bucket name: `sound-connect-assets`
- Binding: `ASSETS` (accessible via `c.env.ASSETS` in API and queue consumers)
- Public URL: `https://pub-fe5ef299f3464b73b8c54144ff278eae.r2.dev`
- No egress fees (Cloudflare R2's key advantage over S3)

**Upload Flow (Hybrid Approach):**

*Modern Flow (Presigned URLs - Recommended):*
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

*Legacy Flow (Through-API - For backward compatibility):*
- Client uploads via `POST /posts` (with media) or `PUT /media`
- API receives file and uploads to R2 using `c.env.ASSETS.put(key, file)`
- Optional: Queue consumer processes for moderation (future AI moderation)

*Result:* Files publicly accessible at `https://pub-fe5ef299f3464b73b8c54144ff278eae.r2.dev/{key}`

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

**Cost:**
- Storage: $0.015/GB/month
- Class A operations (PUT): $4.50/million
- Class B operations (GET): $0.50/million
- Egress: FREE (no bandwidth charges)
- Estimated cost for 10k DAU: ~$3-5/month

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

#### Database (`packages/drizzle`)

- Column names MUST use snake_case (e.g., `created_at`, `user_id`, `post_id`)
- All columns MUST have explicit column names specified in the schema definition
- **Date field types**:
    - **Authentication tables** (users, sessions, accounts, verifications): Use `integer({ mode: 'timestamp' })` for date fields (better-auth expects Date objects)
    - **Application tables** (posts, comments, messages, etc.): Use `text()` for date fields (stores ISO 8601 strings for JSON serialization)
- **Migrations**:
    - Schema migrations (CREATE TABLE, ALTER TABLE, etc.) MUST be generated using `pnpm db:generate` command ONLY
    - NEVER manually create migration files for schema changes
    - Data migrations (INSERT, UPDATE, DELETE, seed data) can be manually created as SQL files
    - Example: Seed users in `0001_seed_users.sql` is allowed (data migration)
    - Example: Adding a new column must use `pnpm db:generate` (schema migration)
- **After schema changes**, run these commands IN ORDER:
    1. `pnpm db:generate` - Generate migration files
    2. Manually update Zod schemas in `packages/common/src/types/drizzle.ts` to match the database schema
    3. `pnpm --filter @sound-connect/api db:migrate:local` - Apply migrations locally
- Always specify explicit column names for all fields
- Use proper foreign key references with `onDelete` actions
- Mark all required fields with `.notNull()`
- Define relations separately from table definitions
- Use TypeScript `as const` for enum definitions before using them in schemas

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
