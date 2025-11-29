import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { NavigationTabs, NavigationTabsContent } from '@/shared/components/common/navigation-tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { AccountSettings } from '@/features/settings/components/account-settings';
import { PrivacySettings } from '@/features/settings/components/privacy-settings';
import { NotificationSettings } from '@/features/settings/components/notification-settings';
import { DataAccountSettings } from '@/features/settings/components/data-account-settings';
import { User, Lock, Bell, Database, AlertCircle } from 'lucide-react';
import { getAccountInfo, getPrivacySettings, getBlockedUsers, getNotificationSettings } from '@/features/settings/server-functions/settings';
import type {
    AccountInfo,
    PrivacySettings as PrivacySettingsType,
    BlockedUser,
    NotificationSettings as NotificationSettingsType
} from '@sound-connect/common/types/settings';

const settingsSearchSchema = z.object({
    tab: z.enum(['account', 'privacy', 'notifications', 'data']).catch('account').default('account')
});

type SettingsData = {
    accountInfo: AccountInfo;
    privacySettings: PrivacySettingsType;
    blockedUsers: BlockedUser[];
    notificationSettings: NotificationSettingsType;
};

export const Route = createFileRoute('/(main)/settings/')({
    component: RouteComponent,
    validateSearch: settingsSearchSchema,
    loader: async () => {
        const [accountResult, privacyResult, blockedResult, notificationResult] = await Promise.all([
            getAccountInfo(),
            getPrivacySettings(),
            getBlockedUsers(),
            getNotificationSettings()
        ]);

        if (!accountResult.success) {
            return {
                type: 'error' as const,
                message: accountResult.body?.message ?? 'Failed to load account information'
            };
        }

        if (!privacyResult.success) {
            return {
                type: 'error' as const,
                message: privacyResult.body?.message ?? 'Failed to load privacy settings'
            };
        }

        if (!blockedResult.success) {
            return {
                type: 'error' as const,
                message: blockedResult.body?.message ?? 'Failed to load blocked users'
            };
        }

        if (!notificationResult.success) {
            return {
                type: 'error' as const,
                message: notificationResult.body?.message ?? 'Failed to load notification settings'
            };
        }

        return {
            type: 'success' as const,
            data: {
                accountInfo: accountResult.body,
                privacySettings: privacyResult.body,
                blockedUsers: blockedResult.body.blockedUsers,
                notificationSettings: notificationResult.body
            } as SettingsData
        };
    }
});

function RouteComponent() {
    const loaderData = Route.useLoaderData();
    const { tab } = Route.useSearch();

    return (
        <div className="container max-w-5xl py-8">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings and preferences</p>
                </div>

                {loaderData.type === 'error' ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{loaderData.message}</AlertDescription>
                    </Alert>
                ) : (
                    <NavigationTabs
                        defaultValue={tab}
                        urlParam="tab"
                        tabs={[
                            {
                                value: 'account',
                                label: <span className="hidden sm:inline">Account</span>,
                                icon: <User className="h-4 w-4" />
                            },
                            {
                                value: 'privacy',
                                label: <span className="hidden sm:inline">Privacy</span>,
                                icon: <Lock className="h-4 w-4" />
                            },
                            {
                                value: 'notifications',
                                label: <span className="hidden sm:inline">Notifications</span>,
                                icon: <Bell className="h-4 w-4" />
                            },
                            {
                                value: 'data',
                                label: <span className="hidden sm:inline">Data</span>,
                                icon: <Database className="h-4 w-4" />
                            }
                        ]}
                        className="space-y-6"
                    >
                        <NavigationTabsContent value="account">
                            <AccountSettings accountInfo={loaderData.data.accountInfo} />
                        </NavigationTabsContent>

                        <NavigationTabsContent value="privacy">
                            <PrivacySettings privacySettings={loaderData.data.privacySettings} blockedUsers={loaderData.data.blockedUsers} />
                        </NavigationTabsContent>

                        <NavigationTabsContent value="notifications">
                            <NotificationSettings notificationSettings={loaderData.data.notificationSettings} />
                        </NavigationTabsContent>

                        <NavigationTabsContent value="data">
                            <DataAccountSettings />
                        </NavigationTabsContent>
                    </NavigationTabs>
                )}
            </div>
        </div>
    );
}
