import { createFileRoute, Outlet, redirect, useLocation, useRouteContext } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChatWindowsUI } from '@/features/chat/components/chat-windows-ui';
import Header from '@/shared/components/layout/header';
import { LeftSidebarDesktop } from '@/shared/components/layout/left-sidebar';
import RightSidebar from '@/shared/components/layout/right-sidebar';
import { useMessaging } from '@/shared/stores/messaging-store';
import { useChat } from '@/shared/stores/chat-store';
import { useNotifications } from '@/shared/stores/notifications-store';
import { ConversationsListSidebar } from '@/shared/components/layout/conversations-list-sidebar';
import { useEnvs } from '@/shared/lib/react-query';
import { getOnboardingStatus } from '@/features/onboarding/server-functions/onboarding';

export const Route = createFileRoute('/(main)')({
    component: RouteComponent,
    beforeLoad: async ({ context }) => {
        if (!context.user || !context.accessToken) {
            const path = '/sign-in';

            throw redirect({
                to: path
            });
        }

        return {
            user: context.user,
            accessToken: context.accessToken
        };
    },
    loader: async ({ location }) => {
        const result = await getOnboardingStatus();

        if (!result.success) {
            throw redirect({
                to: '/onboarding',
                search: { redirect: location.pathname },
                replace: true
            });
        }

        const onboardingStatus = result.body;

        if (!onboardingStatus.exists || (!onboardingStatus.completedAt && !onboardingStatus.skippedAt)) {
            throw redirect({
                to: '/onboarding',
                search: { redirect: location.pathname },
                replace: true
            });
        }
    }
});

function LayoutContent() {
    const location = useLocation();
    const context = useRouteContext({ from: '/(main)' });
    const { data: envs } = useEnvs();
    const queryClient = useQueryClient();
    const isMessagesPage = location.pathname === '/messages';

    const { connect: connectChat, disconnect: disconnectChat } = useChat();
    const { connect: connectNotifications, disconnect: disconnectNotifications } = useNotifications();

    useEffect(() => {
        if (!envs || !context.accessToken) return;

        connectChat({ user: context.user, accessToken: context.accessToken }, envs, queryClient);
        connectNotifications({ user: context.user, accessToken: context.accessToken }, envs);

        return () => {
            disconnectChat();
            disconnectNotifications();
        };
    }, [context.accessToken, envs, connectChat, disconnectChat, connectNotifications, disconnectNotifications, queryClient, context.user]);

    return (
        <>
            <a
                href="#main-content"
                className="focus-visible:ring-ring focus-visible:bg-primary focus-visible:text-primary-foreground sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:px-4 focus-visible:py-2 focus-visible:ring-2 focus-visible:outline-none"
            >
                Skip to main content
            </a>
            <Header />
            <main id="main-content" className="w-full py-20">
                <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-12 lg:px-6 xl:mx-auto xl:max-w-[1400px]">
                    <LeftSidebarDesktop />
                    {isMessagesPage ? <MessagesLayout /> : <StandardLayout />}
                </div>
            </main>
            <ChatWindowsUI />
        </>
    );
}

function StandardLayout() {
    return (
        <>
            <div className="lg:col-span-6">
                <Outlet />
            </div>
            <RightSidebar />
        </>
    );
}

function MessagesLayout() {
    const { selectedPeer, setSelectedPeer, selectedBand, setSelectedBand } = useMessaging();

    return (
        <>
            <div className="lg:col-span-6">
                <Outlet />
            </div>
            <div className="hidden lg:col-span-3 lg:block">
                <ConversationsListSidebar
                    selectedPeer={selectedPeer}
                    onSelectPeer={setSelectedPeer}
                    selectedBand={selectedBand}
                    onSelectBand={setSelectedBand}
                />
            </div>
        </>
    );
}

function RouteComponent() {
    return <LayoutContent />;
}
