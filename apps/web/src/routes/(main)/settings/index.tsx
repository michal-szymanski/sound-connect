import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
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
    const navigate = Route.useNavigate();
    const loaderData = Route.useLoaderData();
    const { tab } = Route.useSearch();

    const handleTabChange = (value: string) => {
        navigate({
            search: { tab: value as z.infer<typeof settingsSearchSchema>['tab'] }
        });
    };

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
                    <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
                        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                            <TabsTrigger value="account" className="gap-2">
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline">Account</span>
                            </TabsTrigger>
                            <TabsTrigger value="privacy" className="gap-2">
                                <Lock className="h-4 w-4" />
                                <span className="hidden sm:inline">Privacy</span>
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="gap-2">
                                <Bell className="h-4 w-4" />
                                <span className="hidden sm:inline">Notifications</span>
                            </TabsTrigger>
                            <TabsTrigger value="data" className="gap-2">
                                <Database className="h-4 w-4" />
                                <span className="hidden sm:inline">Data</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="account">
                            <AccountSettings accountInfo={loaderData.data.accountInfo} />
                        </TabsContent>

                        <TabsContent value="privacy">
                            <PrivacySettings privacySettings={loaderData.data.privacySettings} blockedUsers={loaderData.data.blockedUsers} />
                        </TabsContent>

                        <TabsContent value="notifications">
                            <NotificationSettings notificationSettings={loaderData.data.notificationSettings} />
                        </TabsContent>

                        <TabsContent value="data">
                            <DataAccountSettings />
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
