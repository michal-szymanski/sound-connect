import { test as base } from '@playwright/test';
import { restoreSnapshot } from '@/e2e/utils/db-snapshot';

type DbResetFixture = {
    _dbReset: void;
};

export const test = base.extend<DbResetFixture>({
    _dbReset: [
        // eslint-disable-next-line no-empty-pattern
        async ({}, use) => {
            restoreSnapshot();
            await use();
        },
        { auto: true }
    ]
});

export { expect } from '@playwright/test';
