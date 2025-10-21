import { test, expect } from '@playwright/test';
import { signIn, TEST_USERS } from '../utils/auth';

test.describe('User Sign In', () => {
    test('should sign in successfully with valid credentials', async ({ page }) => {
        await signIn(page, TEST_USERS.USER_A);

        await expect(page).toHaveURL('/');

        const accountButton = page.locator('button:has-text("Playwright User 1")');
        await expect(accountButton).toBeVisible();

        await accountButton.click();
        await expect(page.getByRole('menuitem', { name: 'Log Out' })).toBeVisible();
    });
});
