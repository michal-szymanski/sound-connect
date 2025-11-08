# Sound Connect - Social Media for Musicians

This project is a monorepo containing a social media app designed like LinkedIn but for musicians. People can connect with each other through music, allowing bands to find band members and vice versa. It includes typical social media features: chat between users, creating posts, comments, reactions, and notifications.

## Architecture

- **Frontend**: `apps/web` - Tanstack Start (95% Tanstack Router + extras), ShadCN, TailwindCSS, hosted on Cloudflare Workers
- **Backend**:
    - `apps/api` - REST API built with Cloudflare Workers, Durable Objects for real-time communication, Drizzle.js ORM with D1 database
    - `apps/posts-queue-consumer` - Queue consumer worker for content moderation, using Cloudflare Queues
    - `apps/notifications-queue-consumer` - Queue consumer worker for processing and delivering notifications, using Cloudflare Queues
- **Common**: `packages/common` - Shared types, constants, and utilities between frontend and backend

## Quick Reference

### Development Servers
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:4000` (includes posts-queue-consumer)

### Test Users
| Email      | Password | Name |
|------------|----------|------|
| t1@asd.asd | aaaaaaaa | t1   |
| t2@asd.asd | aaaaaaaa | t2   |

Defined in: `packages/drizzle/migrations/0001_seed_users.sql`

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
│       - system-architect (if multi-domain) OR
│       - frontend/backend (if single-domain)
│
├─ BUG FIX
│  ├─ Frontend bug → Invoke: frontend
│  ├─ Backend bug → Invoke: backend
│  └─ Multi-domain bug → Invoke: system-architect
│
├─ DATABASE WORK
│  └─ Invoke: database-architect
│     • Designs schema
│     • Delegates to backend for implementation
│
├─ DEPLOYMENT / OPERATIONS
│  └─ Invoke: devops
│     • Handles deployments
│     • Applies database migrations
│     • Requires user approval
│
├─ TESTING
│  └─ Invoke: test-expert
│     • E2E tests (Playwright)
│     • Integration tests
│     • Unit tests
│
└─ REFACTORING
   ├─ Single app → Invoke: frontend or backend
   └─ Cross-cutting → Invoke: system-architect
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
- Coordinates multi-domain features (frontend + backend + shared code)
- Manages `packages/common` (Zod schemas, types, utilities)
- Ensures type safety across the stack
- Delegates to frontend/backend agents
- Use when: Feature spans multiple domains
- DON'T use when: Feature is frontend-only or backend-only

**frontend**
- Tanstack Start implementation
- React components and server functions
- Tanstack Query hooks
- Auto-invokes code-quality-enforcer
- Use when: Frontend-only features or frontend portion of multi-domain

**backend**
- Hono API routes
- Drizzle ORM queries
- Durable Objects
- Queue consumers
- Auto-invokes code-quality-enforcer
- Use when: Backend-only features or backend portion of multi-domain

**realtime-architect**
- WebSocket features
- Durable Objects for real-time
- Connection management
- Use when: Real-time features (chat, notifications, live updates)

**devops**
- Cloudflare Workers deployments
- Database migrations (production)
- Monitoring configuration
- Requires user approval for ALL operations
- Use when: Deployment or operational tasks

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
     - Task(system-architect) → Implementation
       - Creates Zod schemas in packages/common
       - Task(backend) → PUT /posts/:id endpoint
       - Task(frontend) → Edit form component
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

#### Key Principles

1. **Always start with feature-spec-writer for new features** - It handles the entire workflow automatically
2. **Use system-architect only for multi-domain features** - Skip it for frontend-only or backend-only work
3. **Don't invoke code-quality-enforcer manually** - frontend/backend agents do this automatically
4. **Specify the spec file path** - When delegating, reference the spec created by feature-spec-writer

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

#### Backend API (`apps/api`)
- ALWAYS access current user ID with `c.get('user')` - NEVER trust user IDs from frontend requests

#### Database (`packages/drizzle`)
- Column names MUST use snake_case (e.g., `created_at`, `user_id`, `post_id`)
- All columns MUST have explicit column names specified in the schema definition
- **Date field types**:
  - **Authentication tables** (users, sessions, accounts, verifications): Use `integer({ mode: 'timestamp' })` for date fields (better-auth expects Date objects)
  - **Application tables** (posts, comments, messages, etc.): Use `text()` for date fields (stores ISO 8601 strings for JSON serialization)
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
