import { createFileRoute, Outlet, redirect, useLocation, useRouteContext } from '@tanstack/react-router';
import { ChatWindowProvider } from '@/features/chat/components/chat-window-manager';
import Header from '@/shared/components/layout/header';
import LeftSidebarMobile, { LeftSidebarDesktop } from '@/shared/components/layout/left-sidebar';
import RightSidebar from '@/shared/components/layout/right-sidebar';
import { SidebarProvider as ShadcnSidebarProvider } from '@/shared/components/ui/sidebar';
import { ChatProvider } from '@/shared/components/providers/chat-provider';
import { NotificationsProvider } from '@/features/notifications/providers/notifications-provider';
import { MessagingProvider, useMessagingContext } from './messages/context';
import { ConversationsListSidebar } from '@/shared/components/layout/conversations-list-sidebar';
import { useEnvs } from '@/shared/lib/react-query';

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
    }
});

function LayoutContent() {
    const location = useLocation();
    const context = useRouteContext({ from: '/(main)' });
    const { data: envs } = useEnvs();
    const isMessagesPage = location.pathname === '/messages';

    return (
        <ChatProvider auth={{ user: context.user, accessToken: context.accessToken }} envs={envs}>
            <NotificationsProvider auth={{ user: context.user, accessToken: context.accessToken }} envs={envs}>
                <ChatWindowProvider>
                    <ShadcnSidebarProvider>
                        <MessagingProvider>
                            <a
                                href="#main-content"
                                className="focus-visible:ring-ring focus-visible:bg-primary focus-visible:text-primary-foreground sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:px-4 focus-visible:py-2 focus-visible:ring-2 focus-visible:outline-none"
                            >
                                Skip to main content
                            </a>
                            <LeftSidebarMobile />
                            <Header />
                            <main id="main-content" className="w-full py-20">
                                <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-12 lg:px-6 xl:mx-auto xl:max-w-[1400px]">
                                    <LeftSidebarDesktop />
                                    {isMessagesPage ? <MessagesLayout /> : <StandardLayout />}
                                </div>
                            </main>
                        </MessagingProvider>
                    </ShadcnSidebarProvider>
                </ChatWindowProvider>
            </NotificationsProvider>
        </ChatProvider>
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
    const { selectedPeer, setSelectedPeer, selectedBand, setSelectedBand } = useMessagingContext();

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
