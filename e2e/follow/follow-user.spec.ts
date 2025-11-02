import { test } from '@/e2e/hooks';
import { signIn, TEST_USERS } from '@/e2e/utils/auth';
import { searchAndNavigateToUser } from '@/e2e/utils/navigation';
import { followUser, unfollowUser, expectFollowingState, expectNotFollowingState } from '@/e2e/utils/follow';

test.describe('Follow User', () => {
    test('should follow user and show following state', async ({ page }) => {
        await signIn(page, TEST_USERS.USER_A);
        await page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(page, TEST_USERS.USER_B.name);

        await followUser(page);
        await expectFollowingState(page);
    });

    test('should unfollow user and show not following state', async ({ page }) => {
        await signIn(page, TEST_USERS.USER_A);
        await page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(page, TEST_USERS.USER_B.name);

        await followUser(page);
        await expectFollowingState(page);

        await unfollowUser(page);
        await expectNotFollowingState(page);
    });

    test('should persist following state after page reload', async ({ page }) => {
        await signIn(page, TEST_USERS.USER_A);
        await page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(page, TEST_USERS.USER_B.name);

        await followUser(page);
        await expectFollowingState(page);

        await page.reload();
        await page.waitForLoadState('networkidle');

        await expectFollowingState(page);
    });

    test('should persist not following state after page reload', async ({ page }) => {
        await signIn(page, TEST_USERS.USER_A);
        await page.waitForLoadState('networkidle');

        await searchAndNavigateToUser(page, TEST_USERS.USER_B.name);

        await followUser(page);
        await expectFollowingState(page);

        await unfollowUser(page);
        await expectNotFollowingState(page);

        await page.reload();
        await page.waitForLoadState('networkidle');

        await expectNotFollowingState(page);
    });
});
