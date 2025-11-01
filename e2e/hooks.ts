import { test as base, type Page } from '@playwright/test';
import { cleanTestData } from '@/e2e/utils/db-snapshot';

type DbResetFixture = {
    _dbReset: void;
};

type ErrorLoggingFixture = {
    _errorLogging: void;
};

type DebugTabFixture = {
    _debugTab: void;
};

type FailedRequest = {
    url: string;
    status: number;
    method: string;
};

function isViteModuleRequest(url: string): boolean {
    return (
        url.includes('/@fs/') ||
        url.includes('/node_modules/') ||
        url.includes('.vite/deps/') ||
        url.includes('?v=') ||
        (!url.includes('/api/') && (url.includes('/src/') || url.endsWith('.ts') || url.endsWith('.tsx') || url.endsWith('.js')))
    );
}

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

    page.on('requestfailed', (request) => {
        const url = request.url();

        if (isViteModuleRequest(url)) {
            return;
        }

        failedRequests.push({
            url,
            status: 0,
            method: request.method()
        });
        console.error(`[E2E ERROR]${prefix} Network request failed: ${request.method()} ${url} - ${request.failure()?.errorText || 'Unknown error'}`);
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
                cleanTestData();
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
    })
    .extend<DebugTabFixture>({
        _debugTab: [
            async ({ context }, use) => {
                if (process.env['PWDEBUG']) {
                    const debugPage = await context.newPage();
                    await debugPage.goto('http://localhost:3000/__debug');
                }
                await use();
            },
            { auto: true }
        ]
    });

export { expect } from '@playwright/test';
