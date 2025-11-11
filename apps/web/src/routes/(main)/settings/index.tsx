import { createFileRoute } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { AccountSettings } from '@/features/settings/components/account-settings';
import { PrivacySettings } from '@/features/settings/components/privacy-settings';
import { NotificationSettings } from '@/features/settings/components/notification-settings';
import { DataAccountSettings } from '@/features/settings/components/data-account-settings';
import { User, Lock, Bell, Database } from 'lucide-react';

type SearchParams = {
    tab?: 'account' | 'privacy' | 'notifications' | 'data';
};

export const Route = createFileRoute('/(main)/settings/')({
    component: RouteComponent,
    validateSearch: (search: Record<string, unknown>): SearchParams => {
        return {
            tab: ['account', 'privacy', 'notifications', 'data'].includes(search['tab'] as string) ? (search['tab'] as SearchParams['tab']) : 'account'
        };
    }
});

function RouteComponent() {
    const navigate = Route.useNavigate();
    const { tab = 'account' } = Route.useSearch();

    const handleTabChange = (value: string) => {
        navigate({
            search: { tab: value as SearchParams['tab'] }
        });
    };

    return (
        <div className="container max-w-5xl py-8">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your account settings and preferences</p>
                </div>

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
                        <AccountSettings />
                    </TabsContent>

                    <TabsContent value="privacy">
                        <PrivacySettings />
                    </TabsContent>

                    <TabsContent value="notifications">
                        <NotificationSettings />
                    </TabsContent>

                    <TabsContent value="data">
                        <DataAccountSettings />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
