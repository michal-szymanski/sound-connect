import Header from '@/components/header';
import LeftSidebar from '@/components/left-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function MainLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            <LeftSidebar />
            <main className="w-full py-20">
                <Header />
                <div className="px-26 xl:px-56">{children}</div>
            </main>
        </SidebarProvider>
    );
}
