import Header from '@/web/components/layout/header';
import LeftSidebar from '@/web/components/layout/left-sidebar';
import RightSidebar from '@/web/components/layout/right-sidebar';
import { SidebarProvider } from '@/web/components/ui/sidebar';
import { WebSocketProvider } from '@/web/providers/websocket-provider';
import { ChatWindowProvider } from '@/web/components/chat/chat-window-manager';
import { store } from '@/web/redux/store';
import { createFileRoute, Outlet, redirect, useLocation } from '@tanstack/react-router';
import { Provider as ReduxProvider } from 'react-redux';

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

function RouteComponent() {
    const location = useLocation();
    const isMessagesPage = location.pathname === '/messages';

    return (
        <ReduxProvider store={store}>
            <WebSocketProvider>
                <ChatWindowProvider>
                    <SidebarProvider>
                        <LeftSidebar />
                        {isMessagesPage ? (
                            <>
                                <div className="fixed left-0 right-0 top-0 z-10 ml-16 xl:ml-64">
                                    <Header />
                                </div>
                                <main className="h-screen flex-1 pt-16">
                                    <Outlet />
                                </main>
                            </>
                        ) : (
                            <>
                                <main className="w-full py-20">
                                    <Header />
                                    <div className="px-26 xl:px-56">
                                        <Outlet />
                                    </div>
                                </main>
                                <RightSidebar />
                            </>
                        )}
                    </SidebarProvider>
                </ChatWindowProvider>
            </WebSocketProvider>
        </ReduxProvider>
    );
}
