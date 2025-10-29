import { test, expect } from '@/e2e/hooks';
import { signIn, TEST_USERS } from '@/e2e/utils/auth';

test.describe('User Sign In', () => {
    test('should sign in successfully with valid credentials', async ({ page }) => {
        await signIn(page, TEST_USERS.USER_A);

        await expect(page).toHaveURL('/');

        const accountButton = page.getByTestId('user-menu');
        await expect(accountButton).toBeVisible();
        await expect(accountButton).toContainText(TEST_USERS.USER_A.name);

        await accountButton.click();
        await expect(page.getByTestId('sign-out-button')).toBeVisible();
    });
});
