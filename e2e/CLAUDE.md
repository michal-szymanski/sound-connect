# E2E Tests

This folder contains end-to-end tests for the Sound Connect application using Playwright.

📚 **[← Back to Main Documentation](../CLAUDE.md)**

## Test Users

For Playwright e2e tests, the following test users are seeded in the database:

| Email         | Password | Name              |
| ------------- | -------- | ----------------- |
| pw1@test.test | Test123! | Playwright User 1 |
| pw2@test.test | Test123! | Playwright User 2 |

These users are defined in the migration: `packages/drizzle/migrations/0009_seed_playwright_users.sql`

## Running Tests

Make sure the development environment is running before executing tests:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
