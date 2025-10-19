import type { Page } from '@playwright/test';

type UserCredentials = {
    name: string;
    email: string;
    password: string;
};

export async function signUp(page: Page, credentials: UserCredentials): Promise<void> {
    await page.goto('/sign-up');

    await page.fill('input[name="name"]', credentials.name);
    await page.fill('input[name="email"]', credentials.email);
    await page.fill('input[name="password"]', credentials.password);

    await page.click('button[type="submit"]');

    try {
        await page.waitForURL('/', { timeout: 10000 });
    } catch (error) {
        const currentUrl = page.url();
        if (currentUrl.includes('/sign-up')) {
            throw new Error(`Sign up failed. Still on: ${currentUrl}`);
        }
        throw error;
    }
}

export async function signIn(page: Page, credentials: Pick<UserCredentials, 'email' | 'password'>): Promise<void> {
    await page.goto('/sign-in');

    await page.fill('input[name="email"]', credentials.email);
    await page.fill('input[name="password"]', credentials.password);

    await page.click('button[type="submit"]');

    try {
        await page.waitForURL('/', { timeout: 10000 });
    } catch (error) {
        const currentUrl = page.url();
        if (currentUrl.includes('/sign-in')) {
            throw new Error(`Sign in failed. Still on: ${currentUrl}`);
        }
        throw error;
    }
}

export async function signOut(page: Page): Promise<void> {
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Sign out")');
    await page.waitForURL('/sign-in');
}

export function generateTestUser(suffix: string): UserCredentials {
    const timestamp = Date.now();
    return {
        name: `Test User ${suffix}`,
        email: `testuser${suffix}_${timestamp}@example.com`,
        password: 'TestPassword123!'
    };
}

export const TEST_USERS = {
    USER_A: {
        email: 'pw1@test.test',
        password: 'Test123!'
    },
    USER_B: {
        email: 'pw2@test.test',
        password: 'Test123!'
    }
};
