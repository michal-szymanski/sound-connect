import { test, expect } from '@/e2e/hooks';
import { signIn, TEST_USERS } from '@/e2e/utils/auth';

test.describe('User Sign Out', () => {
    test('should sign out successfully', async ({ page }) => {
        await signIn(page, TEST_USERS.USER_A);

        await expect(page).toHaveURL('/');

        const accountButton = page.getByTestId('user-menu');
        await accountButton.click();

        const logOutMenuItem = page.getByTestId('sign-out-button');
        await logOutMenuItem.click();

        await expect(page).toHaveURL('/sign-in');
    });
});
