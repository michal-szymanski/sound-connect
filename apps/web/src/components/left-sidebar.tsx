import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from 'src/components/ui/sidebar';
import { Bell, Cog, House, LucideIcon, Mail, UserRound } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import AccountButton from '@/web/components/account-button';
import { useSuspenseQuery } from '@tanstack/react-query';
import { userQueryOptions } from '@/web/lib/react-query';
import { User } from '@/web/types/auth';
import { useState } from 'react';
import NotificationsSheet from '@/web/components/notifications-sheet';
import { Badge } from '@/web/components/ui/badge';
import { useUserStatuses } from '@/web/providers/user-statuses-provider';

type Item = {
    title: string;
    url?: string;
    icon: LucideIcon;
    onClick?: () => void;
};

const LeftSidebar = () => {
    const { data: user } = useSuspenseQuery(userQueryOptions(null));
    const [open, setOpen] = useState(false);
    const { followRequestNotifications } = useUserStatuses();

    const getItems = (user?: User | null): Item[] => {
        if (!user) return [];

        return [
            {
                title: 'Home',
                url: '/',
                icon: House
            },
            {
                title: 'Notifications',
                onClick: () => setOpen((prev) => !prev),
                icon: Bell
            },
            {
                title: 'Messages',
                url: '/messages',
                icon: Mail
            },
            {
                title: 'Profile',
                url: `/users/${user.id}`,
                icon: UserRound
            },
            {
                title: 'Settings',
                url: '/settings',
                icon: Cog
            }
        ];
    };

    const renderMenuButton = (item: Item) => {
        if (item.onClick) {
            return (
                <SidebarMenuButton onClick={item.onClick} className="flex justify-center xl:justify-start [&>svg]:size-6">
                    <item.icon />
                    <span className="hidden xl:inline">{item.title}</span>
                    {item.title === 'Notifications' && (
                        <Badge variant="destructive" className="ml-auto">
                            {Array.from(followRequestNotifications.values()).filter((n) => !n.seen).length}
                        </Badge>
                    )}
                </SidebarMenuButton>
            );
        }

        return (
            <SidebarMenuButton asChild>
                <Link to={item.url} preload={false} className="flex justify-center xl:justify-start [&>svg]:size-6">
                    <item.icon />
                    <span className="hidden xl:inline">{item.title}</span>
                </Link>
            </SidebarMenuButton>
        );
    };

    return (
        <div className="relative flex">
            <Sidebar
                collapsible="none"
                data-state={open ? 'closed' : 'open'}
                className={`z-52 absolute inset-y-0 left-0 w-52 text-white transition-transform duration-500 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0`}
            >
                <SidebarContent className="flex-none lg:flex-1">
                    <SidebarGroup className="w-min lg:w-full">
                        <SidebarGroupContent className="w-min lg:w-full">
                            <SidebarMenu className="w-min flex-row lg:w-full lg:flex-col">
                                {getItems(user).map((item) => (
                                    <SidebarMenuItem key={item.title}>{renderMenuButton(item)}</SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <AccountButton />
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <NotificationsSheet open={open} setOpen={setOpen} />
        </div>
    );
};

export default LeftSidebar;
