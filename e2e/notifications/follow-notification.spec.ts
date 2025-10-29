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

        await signIn(user1Page, TEST_USERS.USER_A);
        await user1Page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(user1Page, TEST_USERS.USER_B.name);

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
        await signIn(page, TEST_USERS.USER_A);
        await page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(page, TEST_USERS.USER_B.name);

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
