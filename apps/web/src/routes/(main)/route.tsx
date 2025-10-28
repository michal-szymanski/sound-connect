import { createFileRoute, Outlet, redirect, useLocation } from '@tanstack/react-router';
import { Provider as ReduxProvider } from 'react-redux';
import { useSelector } from 'react-redux';
import { ChatWindowProvider } from '@/web/components/chat/chat-window-manager';
import Header from '@/web/components/layout/header';
import LeftSidebar from '@/web/components/layout/left-sidebar';
import RightSidebar from '@/web/components/layout/right-sidebar';
import { SidebarProvider } from '@/web/components/ui/sidebar';
import { WebSocketProvider } from '@/web/providers/websocket-provider';
import { NotificationsProvider } from '@/web/providers/notifications-provider';
import { store } from '@/web/redux/store';
import { RootState } from '@/web/redux/store';

export const Route = createFileRoute('/(main)')({
    component: RouteComponent,
    beforeLoad: async ({ context: { user } }) => {
        if (!user) {
            const path = '/sign-in';

            throw redirect({
                to: path
            });
        }
    }
});

function LayoutContent() {
    const location = useLocation();
    const isMessagesPage = location.pathname === '/messages';
    const { isSidebarCollapsed: _isSidebarCollapsed } = useSelector((state: RootState) => state.ui);

    return (
        <WebSocketProvider>
            <NotificationsProvider>
                <ChatWindowProvider>
                    <SidebarProvider>
                        <LeftSidebar />
                        <Header />
                        {isMessagesPage ? (
                            <>
                                <main className="h-screen flex-1 pt-16">
                                    <Outlet />
                                </main>
                            </>
                        ) : (
                            <>
                                <main className="w-full py-20">
                                    <div className="flex justify-center">
                                        <div className="w-full max-w-2xl px-6">
                                            <Outlet />
                                        </div>
                                    </div>
                                </main>
                                <RightSidebar />
                            </>
                        )}
                    </SidebarProvider>
                </ChatWindowProvider>
            </NotificationsProvider>
        </WebSocketProvider>
    );
}

function RouteComponent() {
    return (
        <ReduxProvider store={store}>
            <LayoutContent />
        </ReduxProvider>
    );
}
