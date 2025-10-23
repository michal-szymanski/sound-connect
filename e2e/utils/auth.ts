import type { Page } from '@playwright/test';

type UserCredentials = {
    name: string;
    email: string;
    password: string;
};

export async function signUp(page: Page, credentials: UserCredentials): Promise<void> {
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');

    const nameInput = page.getByLabel('Name');
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');

    await nameInput.waitFor({ state: 'visible' });
    await emailInput.waitFor({ state: 'visible' });
    await passwordInput.waitFor({ state: 'visible' });

    await nameInput.fill(credentials.name);
    await emailInput.fill(credentials.email);
    await passwordInput.fill(credentials.password);

    await page.getByRole('button', { name: 'Sign up' }).click();

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
    await page.waitForLoadState('networkidle');

    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');

    await emailInput.waitFor({ state: 'visible' });
    await passwordInput.waitFor({ state: 'visible' });

    await emailInput.clear();
    await passwordInput.clear();

    await emailInput.fill(credentials.email);
    await passwordInput.fill(credentials.password);

    await page.getByRole('button', { name: 'Sign in' }).click();

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

export const TEST_USERS = {
    USER_A: {
        email: 'pw1@test.test',
        password: 'Test123!'
    },
    USER_B: {
        email: 'pw2@test.test',
        password: 'Test123!'
    }
} as const;
