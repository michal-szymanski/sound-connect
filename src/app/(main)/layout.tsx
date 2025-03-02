import Header from '@/components/header';
import LeftSidebar from '@/components/left-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function MainLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div>
                <SidebarProvider>
                    <LeftSidebar />
                    <main className="w-full pb-10 pt-20">
                        <Header />
                        {children}
                    </main>
                </SidebarProvider>
            </div>
        </>
    );
}
