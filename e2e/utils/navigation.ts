import type { Page } from '@playwright/test';

export async function searchAndNavigateToUser(page: Page, userName: string, userId: string): Promise<void> {
    const searchButton = page.getByTestId('search-button');
    await searchButton.click();

    const searchInput = page.getByTestId('search-input');
    await searchInput.fill(userName);

    await page.waitForTimeout(600);

    const userResult = page.getByTestId(`search-result-${userId}`);
    await userResult.click();

    await page.waitForURL(/\/users\/.+/);
}
