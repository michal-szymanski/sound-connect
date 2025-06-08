import Header from '@/web/components/layout/header';
import LeftSidebar from '@/web/components/layout/left-sidebar';
import RightSidebar from '@/web/components/layout/right-sidebar';
import { SidebarProvider } from '@/web/components/ui/sidebar';
import { UnifiedWebSocketProvider } from '@/web/providers/unified-websocket-provider';
import { ChatWindowProvider } from '@/web/components/chat/chat-window-manager';
import { store } from '@/web/redux/store';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { Provider } from 'react-redux';

export const Route = createFileRoute('/(main)')({
    component: RouteComponent,
    beforeLoad: async ({ context: { user } }) => {
        if (!user) {
            const path = '/sign-in';
            console.info(`[App] Redirecting to: ${path}`);

            throw redirect({
                to: path
            });
        }
    }
});

function RouteComponent() {
    return (
        <Provider store={store}>
            <UnifiedWebSocketProvider>
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
            </UnifiedWebSocketProvider>
        </Provider>
    );
}
