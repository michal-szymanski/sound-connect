import Header from '@/web/components/header';
import LeftSidebar from '@/web/components/left-sidebar';
import { SidebarProvider } from '@/web/components/ui/sidebar';
import { userQueryOptions } from '@/web/lib/react-query';
import { WebSocketProvider } from '@/web/providers/websocket-provider';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

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
    },
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(userQueryOptions(context.user));
    }
});

function RouteComponent() {
    return (
        <WebSocketProvider>
            <SidebarProvider>
                <LeftSidebar />
                <main className="w-full py-20">
                    <Header />
                    <div className="px-26 xl:px-56">
                        <Outlet />
                    </div>
                </main>
            </SidebarProvider>
        </WebSocketProvider>
    );
}
