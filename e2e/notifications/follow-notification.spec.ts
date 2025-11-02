import { test, expect, setupPageErrorLogging } from '@/e2e/hooks';
import { signIn, signOut, TEST_USERS } from '@/e2e/utils/auth';
import { searchAndNavigateToUser } from '@/e2e/utils/navigation';
import { followUser } from '@/e2e/utils/follow';
import {
    openNotifications,
    waitForNotificationCount,
    expectNotificationContent,
    expectNotificationType,
    deleteFirstNotification,
    getNotificationContent,
    markNotificationsAsRead
} from '@/e2e/utils/notifications';

test.describe('Follow Notifications', () => {
    test('should receive notification when followed by another user', async ({ page, browser }) => {
        const user1Page = page;
        const user2Context = await browser.newContext();
        const user2Page = await user2Context.newPage();

        setupPageErrorLogging(user2Page, 'user2');

        await signIn(user1Page, TEST_USERS.USER_A);
        await signIn(user2Page, TEST_USERS.USER_B);

        await user1Page.waitForLoadState('networkidle');
        await user2Page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(user1Page, TEST_USERS.USER_B.name);
        await followUser(user1Page);

        await user2Page.reload();
        await user2Page.waitForLoadState('networkidle');

        await waitForNotificationCount(user2Page, 1);

        await user2Page.close();
        await user2Context.close();
    });

    test('should show correct notification content and type', async ({ page, browser }) => {
        const user1Page = page;
        const user2Context = await browser.newContext();
        const user2Page = await user2Context.newPage();

        setupPageErrorLogging(user2Page, 'user2');

        await signIn(user1Page, TEST_USERS.USER_A);
        await signIn(user2Page, TEST_USERS.USER_B);

        await user1Page.waitForLoadState('networkidle');
        await user2Page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(user1Page, TEST_USERS.USER_B.name);
        await followUser(user1Page);

        await user2Page.reload();
        await user2Page.waitForLoadState('networkidle');

        await openNotifications(user2Page);

        await expectNotificationContent(user2Page, `${TEST_USERS.USER_A.name} started following you`);
        await expectNotificationType(user2Page, 'New follower');

        await user2Page.close();
        await user2Context.close();
    });

    test('should mark notifications as read when heading is clicked', async ({ page, browser }) => {
        const user1Page = page;
        const user2Context = await browser.newContext();
        const user2Page = await user2Context.newPage();

        setupPageErrorLogging(user2Page, 'user2');

        await signIn(user1Page, TEST_USERS.USER_A);
        await signIn(user2Page, TEST_USERS.USER_B);

        await user1Page.waitForLoadState('networkidle');
        await user2Page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(user1Page, TEST_USERS.USER_B.name);
        await followUser(user1Page);

        await user2Page.reload();
        await user2Page.waitForLoadState('networkidle');

        await waitForNotificationCount(user2Page, 1);
        await openNotifications(user2Page);
        await markNotificationsAsRead(user2Page);

        await waitForNotificationCount(user2Page, 0);

        await user2Page.close();
        await user2Context.close();
    });

    test('should delete notification when delete button is clicked', async ({ page }) => {
        await signIn(page, TEST_USERS.USER_A);
        await page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(page, TEST_USERS.USER_B.name);
        await followUser(page);

        await signOut(page);

        await signIn(page, TEST_USERS.USER_B);
        await page.waitForLoadState('networkidle');

        await openNotifications(page);

        const notificationContent = await getNotificationContent(page, 0);
        await expect(notificationContent).toContainText(`${TEST_USERS.USER_A.name} started following you`);

        await deleteFirstNotification(page);

        await expect(notificationContent).not.toBeVisible();
    });
});
