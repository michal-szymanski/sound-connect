import type { Page, Locator } from '@playwright/test';
import { expect } from '@/e2e/hooks';

export async function openNotifications(page: Page): Promise<void> {
    const notificationsButton = page.getByTestId('notifications-button');
    await expect(notificationsButton).toBeVisible();
    await notificationsButton.click();
}

export async function getUnreadBadge(page: Page): Promise<Locator> {
    return page.getByTestId('notification-unread-badge');
}

export async function getUnreadCount(page: Page): Promise<number> {
    const badge = await getUnreadBadge(page);
    const isVisible = await badge.isVisible();

    if (!isVisible) {
        return 0;
    }

    const text = await badge.textContent();
    return text ? parseInt(text, 10) : 0;
}

export async function waitForNotificationCount(page: Page, expectedCount: number): Promise<void> {
    if (expectedCount === 0) {
        const badge = await getUnreadBadge(page);
        await expect(badge).not.toBeVisible();
    } else {
        const badge = await getUnreadBadge(page);
        await expect(badge).toBeVisible();
        await expect(badge).toHaveText(expectedCount.toString());
    }
}

export async function deleteFirstNotification(page: Page): Promise<void> {
    const deleteButton = page.getByTestId('notification-delete-button').first();
    await deleteButton.click();
}

export async function deleteNotificationByIndex(page: Page, index: number): Promise<void> {
    const deleteButton = page.getByTestId('notification-delete-button').nth(index);
    await deleteButton.click();
}

export async function markNotificationsAsRead(page: Page): Promise<void> {
    const notificationsHeading = page.getByTestId('notifications-heading');
    await notificationsHeading.click();
}

export async function getNotificationContent(page: Page, index: number = 0): Promise<Locator> {
    return page.getByTestId('notification-content').nth(index);
}

export async function getNotificationType(page: Page, index: number = 0): Promise<Locator> {
    return page.getByTestId('notification-type').nth(index);
}

export async function expectNotificationContent(page: Page, expectedText: string, index: number = 0): Promise<void> {
    const content = await getNotificationContent(page, index);
    await expect(content).toContainText(expectedText);
}

export async function expectNotificationType(page: Page, expectedType: string, index: number = 0): Promise<void> {
    const type = await getNotificationType(page, index);
    await expect(type).toHaveText(expectedType);
}

export async function getNotificationCount(page: Page): Promise<number> {
    const notifications = page.getByTestId('notification-content');
    return await notifications.count();
}
