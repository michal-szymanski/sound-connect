import { test, expect } from '@/e2e/hooks';
import { signIn, signOut, TEST_USERS } from '@/e2e/utils/auth';
import { searchAndNavigateToUser } from '@/e2e/utils/navigation';

test.describe('Follow Notification System', () => {
    test('should send notification when user follows another user', async ({ page, browser }) => {
        const user1Page = page;
        const user2Context = await browser.newContext();
        const user2Page = await user2Context.newPage();

        await signIn(user1Page, TEST_USERS.USER_A);
        await signIn(user2Page, TEST_USERS.USER_B);

        await user1Page.waitForLoadState('networkidle');
        await user2Page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(user1Page, TEST_USERS.USER_B.name);

        const followButton = user1Page.getByTestId('follow-button');
        await expect(followButton).toBeVisible({ timeout: 10000 });
        await followButton.click();

        const followingButton = user1Page.getByTestId('following-button');
        await expect(followingButton).toBeVisible();

        await user2Page.reload();
        await user2Page.waitForLoadState('networkidle');

        const notificationsButton = user2Page.getByTestId('notifications-button');
        await expect(notificationsButton).toBeVisible();

        const unreadBadge = user2Page.getByTestId('notification-unread-badge');
        await expect(unreadBadge).toBeVisible();
        await expect(unreadBadge).toHaveText('1');

        await notificationsButton.click();

        const notificationContent = user2Page.getByTestId('notification-content').first();
        await expect(notificationContent).toContainText(`${TEST_USERS.USER_A.name} started following you`);

        const notificationType = user2Page.getByTestId('notification-type').first();
        await expect(notificationType).toHaveText('New follower');

        const notificationsHeading = user2Page.getByTestId('notifications-heading');
        await notificationsHeading.click();

        await user2Page.waitForTimeout(500);

        await expect(unreadBadge).not.toBeVisible();

        await user2Page.close();
        await user2Context.close();
    });

    test('should allow deleting notifications', async ({ page }) => {
        const user1Page = page;

        const failedRequests: Array<{ url: string; status: number }> = [];
        user1Page.on('response', (response) => {
            if (!response.ok() && response.url().includes('/api/')) {
                failedRequests.push({ url: response.url(), status: response.status() });
                console.error(`[DEBUG] API call failed: ${response.url()} - Status: ${response.status()}`);
            }
        });

        user1Page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.error(`[DEBUG] Browser console error: ${msg.text()}`);
            }
        });

        await signIn(user1Page, TEST_USERS.USER_A);
        await user1Page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(user1Page, TEST_USERS.USER_B.name);

        await user1Page.waitForTimeout(2000);

        console.log(`[DEBUG] Current URL after navigation: ${user1Page.url()}`);
        console.log(`[DEBUG] Failed API requests: ${JSON.stringify(failedRequests)}`);

        const followButtonCount = await user1Page.getByTestId('follow-button').count();
        const followingButtonCount = await user1Page.getByTestId('following-button').count();
        const requestedButtonCount = await user1Page.getByTestId('requested-button').count();
        console.log(`[DEBUG] Button counts - follow: ${followButtonCount}, following: ${followingButtonCount}, requested: ${requestedButtonCount}`);

        const followButton = user1Page.getByTestId('follow-button');
        await expect(followButton).toBeVisible({ timeout: 10000 });
        await followButton.click();

        const followingButton = user1Page.getByTestId('following-button');
        await expect(followingButton).toBeVisible();

        await signOut(user1Page);

        await signIn(user1Page, TEST_USERS.USER_B);
        await user1Page.waitForLoadState('networkidle');

        await user1Page.waitForTimeout(1000);

        const notificationsButton = user1Page.getByTestId('notifications-button');
        await notificationsButton.click();

        const notificationContent = user1Page.getByTestId('notification-content').first();
        await expect(notificationContent).toContainText(`${TEST_USERS.USER_A.name} started following you`);

        const deleteButton = user1Page.getByTestId('notification-delete-button').first();
        await deleteButton.click();

        await expect(notificationContent).not.toBeVisible();
    });

    test('should show correct follow status on user page', async ({ page }) => {
        const failedRequests: Array<{ url: string; status: number }> = [];
        page.on('response', (response) => {
            if (!response.ok() && response.url().includes('/api/')) {
                failedRequests.push({ url: response.url(), status: response.status() });
                console.error(`[DEBUG] API call failed: ${response.url()} - Status: ${response.status()}`);
            }
        });

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.error(`[DEBUG] Browser console error: ${msg.text()}`);
            }
        });

        await signIn(page, TEST_USERS.USER_A);
        await page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(page, TEST_USERS.USER_B.name);

        await page.waitForTimeout(2000);

        console.log(`[DEBUG] Current URL after navigation: ${page.url()}`);
        console.log(`[DEBUG] Failed API requests: ${JSON.stringify(failedRequests)}`);

        const followButtonCount = await page.getByTestId('follow-button').count();
        const followingButtonCount = await page.getByTestId('following-button').count();
        const requestedButtonCount = await page.getByTestId('requested-button').count();
        console.log(`[DEBUG] Button counts - follow: ${followButtonCount}, following: ${followingButtonCount}, requested: ${requestedButtonCount}`);

        const followButton = page.getByTestId('follow-button');
        await expect(followButton).toBeVisible({ timeout: 10000 });
        await followButton.click();

        const followingButton = page.getByTestId('following-button');
        await expect(followingButton).toBeVisible();

        await page.reload();
        await page.waitForLoadState('networkidle');

        const followingButtonAfterReload = page.getByTestId('following-button');
        await expect(followingButtonAfterReload).toBeVisible();

        await followingButtonAfterReload.click();

        await page.waitForTimeout(500);

        const followButtonAfterUnfollow = page.getByTestId('follow-button');
        await expect(followButtonAfterUnfollow).toBeVisible();
    });
});
