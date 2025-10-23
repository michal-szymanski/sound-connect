# E2E Tests

This folder contains end-to-end tests for the Sound Connect application using Playwright.

📚 **[← Back to Main Documentation](../CLAUDE.md)** | 📖 **[Read Full E2E Testing Guide](README.md)**

## Database Isolation

Tests use **database snapshots** to ensure complete isolation:

- **Before tests:** Clean database snapshot is created
- **After each test:** Database automatically restores to clean state
- **No manual cleanup needed!**

This ensures tests never interfere with each other and always start with a clean slate.

## Test Users

For Playwright e2e tests, the following test users are seeded in the database:

| Email         | Password | Name              |
| ------------- | -------- | ----------------- |
| pw1@test.test | Test123! | Playwright User 1 |
| pw2@test.test | Test123! | Playwright User 2 |

These users are defined in the migration: `packages/drizzle/migrations/0009_seed_playwright_users.sql`

## Running Tests

### Standard Test Commands

```bash
pnpm test          # Run all tests
pnpm test:ui       # Run with Playwright UI
pnpm test:debug    # Run in debug mode
pnpm test:headed   # Run with visible browser
```

### Manual Database Reset

```bash
pnpm --filter @sound-connect/e2e db:reset
```

**Note:** Playwright automatically starts the dev servers when running tests. You don't need to manually start them unless you're debugging.

## Writing Tests

**Always import from `@/e2e/hooks` instead of `@playwright/test`:**

```typescript
import { test, expect } from '@/e2e/hooks';
import { signIn, TEST_USERS } from '@/e2e/utils/auth';

test.describe('My Feature', () => {
    test('should work correctly', async ({ page }) => {
        await signIn(page, TEST_USERS.USER_A);

        // Database changes are automatically rolled back after this test

        await expect(page).toHaveURL('/');
    });
});
```

## Learn More

See the [complete E2E testing documentation](README.md) for:

- How database snapshots work
- CI/CD integration
- Troubleshooting guide
- Advanced usage
