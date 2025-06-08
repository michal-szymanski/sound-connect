import Header from '@/web/components/layout/header';
import LeftSidebar from '@/web/components/layout/left-sidebar';
import RightSidebar from '@/web/components/layout/right-sidebar';
import { SidebarProvider } from '@/web/components/ui/sidebar';
import { WebSocketProvider } from '@/web/providers/websocket-provider';
import { ChatWindowProvider } from '@/web/components/chat/chat-window-manager';
import { store } from '@/web/redux/store';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
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
    return (
        <ReduxProvider store={store}>
            <WebSocketProvider>
                <ChatWindowProvider>
                    <SidebarProvider>
                        <LeftSidebar />
                        <main className="w-full py-20">
                            <Header />
                            <div className="px-26 xl:px-56">
                                <Outlet />
                            </div>
                        </main>
                        <RightSidebar />
                    </SidebarProvider>
                </ChatWindowProvider>
            </WebSocketProvider>
        </ReduxProvider>
    );
}
