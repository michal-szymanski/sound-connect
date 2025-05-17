import Header from '@/web/components/header';
import LeftSidebar from '@/web/components/left-sidebar';
import { SidebarProvider } from '@/web/components/ui/sidebar';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/(main)')({
    component: RouteComponent
});

function RouteComponent() {
    return (
        <SidebarProvider>
            <LeftSidebar />
            <main className="w-full py-20">
                <Header />
                <div className="px-26 xl:px-56">
                    <Outlet />
                </div>
            </main>
        </SidebarProvider>
    );
}
