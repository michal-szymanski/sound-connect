import { test as base, type Page } from '@playwright/test';
import { restoreSnapshot } from '@/e2e/utils/db-snapshot';

type DbResetFixture = {
    _dbReset: void;
};

type ErrorLoggingFixture = {
    _errorLogging: void;
};

type FailedRequest = {
    url: string;
    status: number;
    method: string;
};

export function setupPageErrorLogging(page: Page, pageName?: string): () => FailedRequest[] {
    const failedRequests: FailedRequest[] = [];
    const prefix = pageName ? `[${pageName}]` : '';

    page.on('response', (response) => {
        if (!response.ok() && response.url().includes('/api/')) {
            failedRequests.push({
                url: response.url(),
                status: response.status(),
                method: response.request().method()
            });
            console.error(`[E2E ERROR]${prefix} API call failed: ${response.request().method()} ${response.url()} - Status: ${response.status()}`);
        }
    });

    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            console.error(`[E2E ERROR]${prefix} Browser console: ${msg.text()}`);
        }
    });

    page.on('pageerror', (error) => {
        console.error(`[E2E ERROR]${prefix} Page error: ${error.message}`);
    });

    return () => failedRequests;
}

export const test = base
    .extend<DbResetFixture>({
        _dbReset: [
            // eslint-disable-next-line no-empty-pattern
            async ({}, use) => {
                restoreSnapshot();
                await use();
            },
            { auto: true }
        ]
    })
    .extend<ErrorLoggingFixture>({
        _errorLogging: [
            async ({ page }, use) => {
                const getFailedRequests = setupPageErrorLogging(page, 'main');

                await use();

                const failedRequests = getFailedRequests();
                if (failedRequests.length > 0) {
                    console.error(`[E2E SUMMARY] Test completed with ${failedRequests.length} failed API request(s):`, JSON.stringify(failedRequests, null, 2));
                }
            },
            { auto: true }
        ]
    });

export { expect } from '@playwright/test';
