import { type ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/shared/components/ui/button';
import { useAdminSession } from '@/shared/hooks/use-admin-session';
import { signOut } from '@/shared/server-functions/auth';
import { toast } from 'sonner';
import { LayoutDashboardIcon, UsersIcon, LogOutIcon } from 'lucide-react';

type Props = {
    children: ReactNode;
};

export function Layout({ children }: Props) {
    const { data: session } = useAdminSession();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate({ to: '/login' });
        } catch {
            toast.error('Failed to log out');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-xl font-bold">
                            Admin Dashboard
                        </Link>
                        <nav className="flex items-center gap-4">
                            <Link
                                to="/"
                                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                activeProps={{ className: 'text-foreground' }}
                            >
                                <LayoutDashboardIcon className="size-4" />
                                Dashboard
                            </Link>
                            <Link
                                to="/users"
                                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                activeProps={{ className: 'text-foreground' }}
                            >
                                <UsersIcon className="size-4" />
                                Users
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        {session?.user && (
                            <div className="text-sm">
                                <span className="text-muted-foreground">Logged in as:</span> <span className="font-medium">{session.user.name}</span>
                            </div>
                        )}
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                            <LogOutIcon className="size-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto py-8 px-4">{children}</main>
        </div>
    );
}
