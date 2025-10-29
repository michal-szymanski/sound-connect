import type { Page } from '@playwright/test';

export async function searchAndNavigateToUser(page: Page, userName: string): Promise<void> {
    const searchButton = page.getByTestId('search-button');
    await searchButton.click();

    const searchInput = page.getByTestId('search-input');
    await searchInput.fill(userName);

    await page.waitForTimeout(600);

    const userResult = page.getByRole('option', { name: userName });
    await userResult.click();

    await page.waitForURL(/\/users\/.+/);
}
