import { test, expect } from '@/e2e/hooks';
import { signIn, TEST_USERS } from '@/e2e/utils/auth';

test.describe('Test Notifications Flow', () => {
    test('should send and receive test notifications between t1 and t2 users', async ({ browser }) => {
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();

        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        await signIn(page1, TEST_USERS.T1);
        await signIn(page2, TEST_USERS.T2);

        await page1.waitForURL('/');
        await page2.waitForURL('/');

        const sendButtonT1 = page1.getByRole('button', { name: /Send Test Notification to t2/i });
        const sendButtonT2 = page2.getByRole('button', { name: /Send Test Notification to t1/i });

        await expect(sendButtonT1).toBeVisible();
        await expect(sendButtonT2).toBeVisible();

        await sendButtonT1.click();

        await page2.waitForTimeout(2000);

        const notificationT2 = page2.getByText(/Test notification from xGvICj1532ArhGacyObqzE1bkEounP0y/i);
        await expect(notificationT2).toBeVisible();

        await sendButtonT2.click();

        await page1.waitForTimeout(2000);

        const notificationT1 = page1.getByText(/Test notification from keUzTIdaFlWWWgiG61OC5nLza3cbIyWN/i);
        await expect(notificationT1).toBeVisible();

        await context1.close();
        await context2.close();
    });

    test('should handle multiple rapid notifications', async ({ browser }) => {
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();

        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        await signIn(page1, TEST_USERS.T1);
        await signIn(page2, TEST_USERS.T2);

        await page1.waitForURL('/');
        await page2.waitForURL('/');

        const sendButtonT1 = page1.getByRole('button', { name: /Send Test Notification to t2/i });
        const sendButtonT2 = page2.getByRole('button', { name: /Send Test Notification to t1/i });
        const notificationsLocator = page2.getByText(/Test notification from/i);

        // Wait for both buttons to be visible and enabled to ensure both WebSocket connections are established
        await expect(sendButtonT1).toBeVisible();
        await expect(sendButtonT2).toBeVisible();
        await expect(sendButtonT1).toBeEnabled();
        await expect(sendButtonT2).toBeEnabled();

        // Now both WebSocket connections are ready, proceed with sending notifications
        await sendButtonT1.click();
        await expect(notificationsLocator).toHaveCount(1);

        await expect(sendButtonT1).toBeEnabled();
        await sendButtonT1.click();
        await expect(notificationsLocator).toHaveCount(2);

        await expect(sendButtonT1).toBeEnabled();
        await sendButtonT1.click();
        await expect(notificationsLocator).toHaveCount(3);

        await context1.close();
        await context2.close();
    });

    test('should reconnect after page refresh', async ({ browser }) => {
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();

        const page1 = await context1.newPage();
        const page2 = await context2.newPage();

        await signIn(page1, TEST_USERS.T1);
        await signIn(page2, TEST_USERS.T2);

        await page1.waitForURL('/');
        await page2.waitForURL('/');

        await page2.reload();
        await page2.waitForURL('/');

        await page2.waitForTimeout(2000);

        const sendButtonT1 = page1.getByRole('button', { name: /Send Test Notification to t2/i });
        await expect(sendButtonT1).toBeVisible();

        await sendButtonT1.click();

        await page2.waitForTimeout(2000);

        const notification = page2.getByText(/Test notification from/i);
        await expect(notification).toBeVisible();

        await context1.close();
        await context2.close();
    });

    test('should show WebSocket connection status', async ({ page }) => {
        await signIn(page, TEST_USERS.T1);
        await page.waitForURL('/');

        const sendButton = page.getByRole('button', { name: /Send Test Notification/i });
        await expect(sendButton).toBeVisible();

        await page.waitForTimeout(2000);

        await expect(sendButton).toBeEnabled();
    });
});
