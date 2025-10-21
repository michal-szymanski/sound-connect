import { test, expect } from '@playwright/test';

test.describe('User Sign Up', () => {
    const testUser = {
        name: 'Test User E2E',
        email: 'test-e2e@playwright.test',
        password: 'TestPass123!'
    };

    test('should sign up successfully with valid credentials', async ({ page }) => {
        await page.goto('/sign-up');
        await page.waitForLoadState('networkidle');

        const nameInput = page.getByLabel('Name');
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Password');

        await nameInput.waitFor({ state: 'visible' });
        await emailInput.waitFor({ state: 'visible' });
        await passwordInput.waitFor({ state: 'visible' });

        await nameInput.fill(testUser.name);
        await emailInput.fill(testUser.email);
        await passwordInput.fill(testUser.password);

        await page.getByRole('button', { name: 'Sign up' }).click();

        await expect(page).toHaveURL('/');

        const accountButton = page.locator(`button:has-text("${testUser.name}")`);
        await expect(accountButton).toBeVisible();
    });
});
