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

type Item = {
    title: string;
    url?: string;
    icon: LucideIcon;
    onClick?: () => void;
};

const LeftSidebar = () => {
    const { data: user } = useSuspenseQuery(userQueryOptions(null));
    const [open, setOpen] = useState(false);

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
        <Sidebar
            collapsible="none"
            className="z-51 fixed bottom-0 h-min w-full flex-row items-center justify-center lg:flex lg:h-full lg:w-min lg:flex-col xl:items-start"
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
            <NotificationsSheet open={open} setOpen={setOpen} />
        </Sidebar>
    );
};

export default LeftSidebar;
