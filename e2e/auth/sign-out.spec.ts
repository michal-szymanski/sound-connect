import { test, expect } from '@playwright/test';
import { signIn, TEST_USERS } from '../utils/auth';

test.describe('User Sign Out', () => {
    test('should sign out successfully', async ({ page }) => {
        await signIn(page, TEST_USERS.USER_A);

        await expect(page).toHaveURL('/');

        const accountButton = page.locator('button:has-text("Playwright User 1")');
        await accountButton.click();

        const logOutMenuItem = page.getByRole('menuitem', { name: 'Log Out' });
        await logOutMenuItem.click();

        await expect(page).toHaveURL('/sign-in');
    });
});
