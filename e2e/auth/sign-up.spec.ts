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

        const accountButton = page.locator('button:has-text("New Test User")');
        await expect(accountButton).toBeVisible();

        await accountButton.click();
        await expect(page.getByRole('menuitem', { name: 'Log Out' })).toBeVisible();
    });

    test('should show error with invalid email format', async ({ page }) => {
        await page.goto('/sign-up');

        const nameInput = page.getByLabel('Name');
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Password');

        await nameInput.fill('Test User');
        await emailInput.fill('invalid-email');
        await passwordInput.fill('TestPassword123!');

        await page.getByRole('button', { name: 'Sign up' }).click();

        await expect(page.url()).toContain('/sign-up');
        await expect(page).not.toHaveURL('/');
    });

    test('should show error with short password', async ({ page }) => {
        await page.goto('/sign-up');

        const nameInput = page.getByLabel('Name');
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Password');

        await nameInput.fill('Test User');
        await emailInput.fill('testuser@playwright.test');
        await passwordInput.fill('short');

        await page.getByRole('button', { name: 'Sign up' }).click();

        await expect(page.url()).toContain('/sign-up');
        await expect(page).not.toHaveURL('/');
    });

    test('should show error when email already exists', async ({ page }) => {
        await page.goto('/sign-up');

        const nameInput = page.getByLabel('Name');
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Password');

        await nameInput.fill('Test User');
        await emailInput.fill('pw1@test.test');
        await passwordInput.fill('TestPassword123!');

        await page.getByRole('button', { name: 'Sign up' }).click();

        await expect(page.url()).toContain('/sign-up');
        await expect(page).not.toHaveURL('/');
    });
});
