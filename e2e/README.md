# E2E Testing with Database Snapshots

This E2E testing setup uses **database snapshots** to ensure clean state between tests. Each test runs against a fresh database, ensuring isolation and preventing data pollution.

## How It Works

### 1. Global Setup (Before All Tests)

When you run `pnpm test`, Playwright:

1. Starts the dev server (`pnpm dev` from root)
2. Waits for migrations to complete
3. **Creates a snapshot** of the clean, migrated database

### 2. During Tests

- Tests run sequentially (`workers: 1`)
- Each test can modify the database freely
- All changes are isolated to the local SQLite file

### 3. After Each Test

- The database is **automatically restored** from the snapshot
- Next test starts with a clean slate
- No manual cleanup needed!

### 4. Global Teardown (After All Tests)

- Snapshot files are cleaned up
- Temporary files removed

---

## Database Location

The local D1 database is stored at:

```
apps/api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite
```

**Important:** This is a **local development database** only. Production data is completely separate and never touched by tests.

---

## Running Tests

### Run All Tests

```bash
pnpm test
```

### Run Tests with UI

```bash
pnpm test:ui
```

### Run Tests in Debug Mode

```bash
pnpm test:debug
```

### Run Tests in Headed Mode (see browser)

```bash
pnpm test:headed
```

### Manually Reset Database

If you need to manually reset the database to the snapshot state:

```bash
pnpm --filter @sound-connect/e2e db:reset
```

---

## Writing Tests

All test files must import from `@/e2e/hooks` instead of `@playwright/test`:

```typescript
import { test, expect } from '@/e2e/hooks'; // ✅ Correct
import { signIn, TEST_USERS } from '@/e2e/utils/auth';

test.describe('My Feature', () => {
    test('should do something', async ({ page }) => {
        await signIn(page, TEST_USERS.USER_A);

        // Make database changes here
        // They will be automatically rolled back after the test

        await expect(page).toHaveURL('/');
    });
});
```

**Don't use:**

```typescript
import { test, expect } from '@playwright/test'; // ❌ Wrong
```

The hooks file automatically:

- Restores the database after each test
- Provides the same `test` and `expect` APIs you're used to

---

## CI/CD Integration

The snapshot/restore system works seamlessly in CI:

1. **Fresh Environment:** CI starts with no database
2. **Migrations Run:** Dev server applies migrations automatically
3. **Snapshot Created:** Clean database is captured
4. **Tests Run:** Each test gets a fresh database
5. **Cleanup:** Snapshot files deleted after tests complete

No special CI configuration needed!

---

## Files Overview

### Core Files

| File                   | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `hooks.ts`             | Exports `test` and `expect` with auto-restore |
| `global-setup.ts`      | Creates database snapshot before tests        |
| `global-teardown.ts`   | Cleans up snapshot files after tests          |
| `utils/db-snapshot.ts` | Low-level snapshot/restore utilities          |
| `scripts/reset-db.ts`  | Manual database reset script                  |

### Configuration

| File                   | Purpose                                     |
| ---------------------- | ------------------------------------------- |
| `playwright.config.ts` | Wires up global setup/teardown              |
| `package.json`         | Test scripts (`pnpm test`, `pnpm db:reset`) |

---

## Troubleshooting

### Error: "Wrangler state directory not found"

**Cause:** Dev server hasn't run yet, so no database exists.

**Solution:** Run `pnpm dev` from the root directory at least once, then run tests.

---

### Error: "Snapshot file not found"

**Cause:** Tests tried to restore but no snapshot was created.

**Solution:** The global setup should create the snapshot. Try running tests again from scratch:

```bash
pnpm test
```

---

### Tests are interfering with each other

**Cause:** Test file not using hooks correctly.

**Solution:** Ensure you're importing from `@/e2e/hooks`:

```typescript
import { test, expect } from '@/e2e/hooks';
```

---

### Manual database corruption

**Cause:** Dev server was stopped mid-migration or database manually modified.

**Solution:** Wipe the database and start fresh:

```bash
pnpm wipe:db  # From root directory
pnpm dev      # Restart dev server
pnpm test     # Run tests
```

---

## How This Differs from Production

| Aspect            | Local/CI (Tests)   | Production                |
| ----------------- | ------------------ | ------------------------- |
| Database Type     | SQLite file        | Cloudflare D1 (remote)    |
| Location          | `.wrangler/state/` | Cloudflare infrastructure |
| Snapshot/Restore  | ✅ Yes             | ❌ No (not needed)        |
| Data Persistence  | Temporary          | Permanent                 |
| Affected by Tests | ✅ Yes             | ❌ Never                  |

**Production is completely isolated from test runs.**

---

## Advanced Usage

### Access Snapshot Utilities Directly

If you need fine-grained control:

```typescript
import { createSnapshot, restoreSnapshot, snapshotExists } from '@/e2e/utils/db-snapshot';

// Check if snapshot exists
if (snapshotExists()) {
    // Restore manually
    restoreSnapshot();
}

// Create a new snapshot manually
createSnapshot();
```

### Disable Auto-Restore for Specific Tests

If you want to test cross-test data persistence (rare):

```typescript
import { test as baseTest, expect } from '@playwright/test';

baseTest('should persist data across tests', async ({ page }) => {
    // This test won't auto-restore
    // Use with caution!
});
```

Then manually restore:

```bash
pnpm --filter @sound-connect/e2e db:reset
```

---

## Benefits

✅ **Isolation:** Each test starts with a clean database
✅ **Speed:** File copy is very fast (~10ms)
✅ **Simplicity:** No complex transaction management
✅ **Reliability:** Guaranteed clean state
✅ **CI-Ready:** Works in GitHub Actions, GitLab CI, etc.
✅ **Production-Safe:** Never touches remote database

---

## Questions?

Refer to the [main project documentation](../CLAUDE.md) or [E2E test documentation](CLAUDE.md).
