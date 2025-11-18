import { Link, useLocation } from '@tanstack/react-router';
import { House, LucideIcon, Mail, Users, Music, Compass } from 'lucide-react';
import { UserQuickInfoCard } from '@/shared/components/layout/user-quick-info-card';
import { useAuth } from '@/shared/lib/react-query';

type Item = {
    title: string;
    url?: string;
    icon: LucideIcon;
    onClick?: () => void;
};

const getItems = (userId: string | undefined): Item[] => {
    if (!userId) return [];

    return [
        {
            title: 'Home',
            url: '/',
            icon: House
        },
        {
            title: 'Discover Bands',
            url: '/discover/bands',
            icon: Compass
        },
        {
            title: 'Find Musicians',
            url: '/musicians',
            icon: Users
        },
        {
            title: 'Find Bands',
            url: '/bands/search',
            icon: Music
        },
        {
            title: 'Messages',
            url: '/messages',
            icon: Mail
        },
        {
            title: 'My Bands',
            url: '/bands',
            icon: Music
        }
    ];
};

export function LeftSidebarDesktop() {
    const { data: auth } = useAuth();
    const location = useLocation();

    const items = getItems(auth?.user?.id);

    return (
        <aside className="sticky top-20 hidden h-fit lg:col-span-3 lg:block">
            <nav className="space-y-4" aria-label="Main navigation">
                <UserQuickInfoCard />
                <div className="space-y-1">
                    {items.map((item) => {
                        const isActive = item.url ? location.pathname === item.url : false;
                        return (
                            <Link
                                key={item.title}
                                to={item.url}
                                preload={false}
                                className={`focus-visible:ring-ring flex min-h-12 items-center gap-3 rounded-md px-3 transition-all focus-visible:ring-2 focus-visible:outline-none ${
                                    isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground hover:bg-accent'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </div>
                <div id="musicians-filters-slot" />
                <div id="bands-filters-slot" />
            </nav>
        </aside>
    );
}
