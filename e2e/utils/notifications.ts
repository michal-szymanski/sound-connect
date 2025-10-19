import type { Page } from '@playwright/test';

export async function waitForNotification(page: Page, text: string, timeout: number = 10000): Promise<void> {
    await page.waitForSelector(`[data-testid="notification"]:has-text("${text}")`, { timeout });
}

export async function getNotificationCount(page: Page): Promise<number> {
    const badge = await page.locator('[data-testid="notification-badge"]').textContent();
    return badge ? parseInt(badge, 10) : 0;
}

export async function openNotifications(page: Page): Promise<void> {
    await page.click('[data-testid="notifications-button"]');
}
