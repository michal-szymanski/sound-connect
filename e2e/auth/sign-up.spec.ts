import { test, expect } from '@/e2e/hooks';
import { signUp } from '@/e2e/utils/auth';

test.describe('User Sign Up', () => {
    test('should sign up successfully with valid credentials', async ({ page }) => {
        const newUser = {
            name: 'New Test User',
            email: 'newuser@playwright.test',
            password: 'TestPassword123!'
        };

        await signUp(page, newUser);

        await expect(page).toHaveURL('/');

        const accountButton = page.getByTestId('user-menu');
        await expect(accountButton).toBeVisible();

        await accountButton.click();
        await expect(page.getByTestId('sign-out-button')).toBeVisible();
    });

    test('should show error with invalid email format', async ({ page }) => {
        await page.goto('/sign-up');

        const nameInput = page.getByTestId('sign-up-name');
        const emailInput = page.getByTestId('sign-up-email');
        const passwordInput = page.getByTestId('sign-up-password');

        await nameInput.fill('Test User');
        await emailInput.fill('invalid-email');
        await passwordInput.fill('TestPassword123!');

        await page.getByTestId('submit-button').click();

        await expect(page.url()).toContain('/sign-up');
        await expect(page).not.toHaveURL('/');
    });

    test('should show error with short password', async ({ page }) => {
        await page.goto('/sign-up');

        const nameInput = page.getByTestId('sign-up-name');
        const emailInput = page.getByTestId('sign-up-email');
        const passwordInput = page.getByTestId('sign-up-password');

        await nameInput.fill('Test User');
        await emailInput.fill('testuser@playwright.test');
        await passwordInput.fill('short');

        await page.getByTestId('submit-button').click();

        await expect(page.url()).toContain('/sign-up');
        await expect(page).not.toHaveURL('/');
    });

    test('should show error when email already exists', async ({ page }) => {
        await page.goto('/sign-up');

        const nameInput = page.getByTestId('sign-up-name');
        const emailInput = page.getByTestId('sign-up-email');
        const passwordInput = page.getByTestId('sign-up-password');

        await nameInput.fill('Test User');
        await emailInput.fill('pw1@test.test');
        await passwordInput.fill('TestPassword123!');

        await page.getByTestId('submit-button').click();

        await expect(page.url()).toContain('/sign-up');
        await expect(page).not.toHaveURL('/');
    });
});
