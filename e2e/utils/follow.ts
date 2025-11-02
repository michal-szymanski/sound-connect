import type { Page } from '@playwright/test';
import { expect } from '@/e2e/hooks';

export async function followUser(page: Page): Promise<void> {
    const followButton = page.getByTestId('follow-button');
    await expect(followButton).toBeVisible({ timeout: 10000 });
    await followButton.click();

    const followingButton = page.getByTestId('following-button');
    await expect(followingButton).toBeVisible();
}

export async function unfollowUser(page: Page): Promise<void> {
    const followingButton = page.getByTestId('following-button');
    await expect(followingButton).toBeVisible({ timeout: 10000 });
    await followingButton.click();

    const followButton = page.getByTestId('follow-button');
    await expect(followButton).toBeVisible();
}

export async function expectFollowingState(page: Page): Promise<void> {
    const followingButton = page.getByTestId('following-button');
    await expect(followingButton).toBeVisible();
}

export async function expectNotFollowingState(page: Page): Promise<void> {
    const followButton = page.getByTestId('follow-button');
    await expect(followButton).toBeVisible();
}

export async function isFollowing(page: Page): Promise<boolean> {
    const followingButton = page.getByTestId('following-button');
    return await followingButton.isVisible();
}
