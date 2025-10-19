# Frontend Application

This is the frontend part of the Sound Connect social media application for musicians.

📚 **[← Back to Main Documentation](../../CLAUDE.md)**

## Technology Stack

- **Framework**: Tanstack Start (95% Tanstack Router + extras) - currently in beta
- **UI Components**: ShadCN and TailwindCSS
- **Hosting**: Cloudflare Worker

## Project Structure

- `src/components/ui/` - ShadCN components (DO NOT MODIFY - auto-generated)
- `src/components/` - Custom components organized in folders
- `src/server-functions/` - Communication with backend API, results wrapped in envelopes for consistency
- `src/types/` - Frontend-specific types

## Development

- **Dev Server**: `http://localhost:3000`
- The web app runs independently and communicates with the API on `http://localhost:4000`

## Test Users

For Playwright e2e tests, the following test users are seeded in the database:

| Email         | Password | Name              |
| ------------- | -------- | ----------------- |
| pw1@test.test | Test123! | Playwright User 1 |
| pw2@test.test | Test123! | Playwright User 2 |

These users are defined in the migration: `packages/drizzle/src/migrations/0009_seed_playwright_users.sql`

## AI Rules

- Never modify files in `src/components/ui` directory - these are ShadCN generated files
