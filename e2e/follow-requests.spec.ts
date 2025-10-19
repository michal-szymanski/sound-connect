import { test, expect } from '@playwright/test';
import { signIn, TEST_USERS } from './utils/auth';

test.describe('Follow Requests', () => {
    test('User A sends follow request to User B, User B accepts it, then sends request to User A, User A accepts it', async ({
        browser
    }) => {
        const userAContext = await browser.newContext();
        const userBContext = await browser.newContext();

        const userAPage = await userAContext.newPage();
        const userBPage = await userBContext.newPage();

        await test.step('User A signs in', async () => {
            await signIn(userAPage, TEST_USERS.USER_A);
            await expect(userAPage).toHaveURL('/');
        });

        await test.step('User B signs in', async () => {
            await signIn(userBPage, TEST_USERS.USER_B);
            await expect(userBPage).toHaveURL('/');
        });

        let userBId: string;

        await test.step('User A gets User B profile ID', async () => {
            await userAPage.goto('/');
            await userAPage.waitForLoadState('networkidle');

            const userBProfileLink = await userAPage.locator('a:has-text("Playwright User 2")').first();
            await expect(userBProfileLink).toBeVisible();

            const href = await userBProfileLink.getAttribute('href');
            expect(href).toBeTruthy();
            userBId = href!.split('/').pop()!;
        });

        await test.step('User A sends follow request to User B', async () => {
            await userAPage.goto(`/users/${userBId}`);
            await userAPage.waitForLoadState('networkidle');

            const followButton = userAPage.locator('button:has-text("Follow")');
            await expect(followButton).toBeVisible();
            await followButton.click();

            await expect(userAPage.locator('button:has-text("Requested")')).toBeVisible();
        });

        await test.step('User B receives follow request notification', async () => {
            await userBPage.waitForTimeout(2000);

            const notificationsButton = userBPage.locator('button:has-text("Notifications")');
            await expect(notificationsButton).toBeVisible();
            await notificationsButton.click();

            await expect(userBPage.locator('text=requested to follow you')).toBeVisible();
        });

        await test.step('User B accepts follow request from User A', async () => {
            const acceptButton = userBPage.locator('button:has-text("Accept")').first();
            await expect(acceptButton).toBeVisible();
            await acceptButton.click();

            await expect(acceptButton).not.toBeVisible({ timeout: 5000 });
        });

        let userAId: string;

        await test.step('User B gets User A profile ID', async () => {
            const notificationsSheet = userBPage.locator('[role="dialog"]');
            await expect(notificationsSheet).toBeVisible();

            const userAProfileLink = notificationsSheet.locator('text=Playwright User 1').first();
            await userAProfileLink.click();

            await userBPage.waitForURL(/\/users\/.+/);
            userAId = userBPage.url().split('/').pop()!;
        });

        await test.step('User B sends follow request to User A', async () => {
            await userBPage.goto(`/users/${userAId}`);
            await userBPage.waitForLoadState('networkidle');

            const followButton = userBPage.locator('button:has-text("Follow")');
            await expect(followButton).toBeVisible();
            await followButton.click();

            await expect(userBPage.locator('button:has-text("Requested")')).toBeVisible();
        });

        await test.step('User A receives follow request notification', async () => {
            await userAPage.waitForTimeout(2000);

            const notificationsButton = userAPage.locator('button:has-text("Notifications")');
            await expect(notificationsButton).toBeVisible();
            await notificationsButton.click();

            await expect(userAPage.locator('text=requested to follow you')).toBeVisible();
        });

        await test.step('User A accepts follow request from User B', async () => {
            const acceptButton = userAPage.locator('button:has-text("Accept")').first();
            await expect(acceptButton).toBeVisible();
            await acceptButton.click();

            await expect(acceptButton).not.toBeVisible({ timeout: 5000 });
        });

        await test.step('Verify both users are following each other', async () => {
            await userAPage.goto(`/users/${userBId}`);
            await userAPage.waitForLoadState('networkidle');
            await expect(userAPage.locator('button:has-text("Following")')).toBeVisible();

            await userBPage.goto(`/users/${userAId}`);
            await userBPage.waitForLoadState('networkidle');
            await expect(userBPage.locator('button:has-text("Following")')).toBeVisible();
        });

        await userAContext.close();
        await userBContext.close();
    });
});
