# E2E Tests

This folder contains end-to-end tests for the Sound Connect application using Playwright.

📚 **[← Back to Main Documentation](../CLAUDE.md)** | 📖 **[Read Full E2E Testing Guide](README.md)**

## Database Isolation

Tests use **database snapshots** to ensure complete isolation:

- **Before tests:** Cleanup queries remove all dynamic test data while preserving test users, then a clean database snapshot is created
- **After each test:** Database automatically restores to clean state from snapshot
- **No manual cleanup needed!**

### How Database Cleanup Works

1. **Global setup** (`e2e/global-setup.ts`):
    - Waits for database to be ready
    - Executes `cleanTestData()` to remove dynamic data (posts, comments, notifications, followers, etc.)
    - Preserves test users (pw1 and pw2) and their authentication data
    - Creates a snapshot of the clean database

2. **Test execution** (`e2e/hooks.ts`):
    - Before each test: Restores database from snapshot
    - Test runs with isolated, predictable state
    - After test: Snapshot restoration ensures clean state for next test

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

### Test Data Guidelines

**IMPORTANT: Tests must be deterministic and reproducible**

❌ **DON'T** use timestamps, random values, or `Date.now()` to generate test values:

```typescript
// Bad - Non-deterministic test data generation
const email = `test-${Date.now()}@test.com`;
const name = `User ${Math.random()}`;
const postContent = `Post ${Math.random()}`;
```

✅ **DO** use fixed, predictable test data:

```typescript
// Good - Deterministic test data
const email = 'testuser@playwright.test';
const name = 'Test User';
const postContent = 'Test post content';
```

**Why?**

- Each test runs with a clean database (snapshot restored automatically)
- No need for unique data - tests are isolated
- Reproducible failures make debugging easier
- Tests are easier to understand and maintain

**Note on `waitForTimeout()`:**
Using `waitForTimeout()` for waiting on UI updates or animations is acceptable when necessary, but prefer Playwright's built-in waiting mechanisms (e.g., `waitForLoadState()`, element visibility checks, network idle state) when possible for more reliable tests.

### Element Selection Guidelines

**IMPORTANT: Prioritize `data-testid` attributes for reliable element selection**

When writing tests, follow this priority order for selecting elements:

1. **First priority: `data-testid`** - Most reliable and resilient to UI changes

```typescript
// Best - Using data-testid
await page.getByTestId('user-menu').click();
await page.getByTestId('sign-out-button').click();
```

2. **Second priority: Semantic roles** - Use when data-testid is not available

```typescript
// Good - Using semantic roles
await page.getByRole('button', { name: 'Sign in' }).click();
await page.getByLabel('Email').fill('test@example.com');
```

3. **Last resort: CSS selectors** - Only when the above options are not feasible

```typescript
// Avoid when possible - Brittle
await page.locator('.user-menu-button').click();
```

**When implementing new features:**

- Add `data-testid` attributes to interactive elements during development
- Use descriptive, kebab-case names (e.g., `data-testid="submit-post-button"`)
- Coordinate with developers to ensure testable components

## Learn More

See the [complete E2E testing documentation](README.md) for:

- How database snapshots work
- CI/CD integration
- Troubleshooting guide
- Advanced usage
