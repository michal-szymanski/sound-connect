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
import AccountButton from '@/web/components/small/account-button';
import { useUser } from '@/web/lib/react-query';
import { useState } from 'react';
import NotificationsSheet from '@/web/components/layout/notifications-sheet';
import { Badge } from '@/web/components/ui/badge';
import { useUnifiedWebSocket } from '@/web/providers/unified-websocket-provider';
import { useSelector } from 'react-redux';
import { RootState } from '@/web/redux/store';

type Item = {
    title: string;
    url?: string;
    icon: LucideIcon;
    onClick?: () => void;
};

const LeftSidebar = () => {
    const { data: user } = useUser();
    const [showNotifications, setShowNotification] = useState(false);
    const { followRequestNotifications } = useUnifiedWebSocket();
    const { isSidebarVisible } = useSelector((state: RootState) => state.ui);

    const getItems = (): Item[] => {
        if (!user) return [];

        return [
            {
                title: 'Home',
                url: '/',
                icon: House
            },
            {
                title: 'Notifications',
                onClick: () => setShowNotification((prev) => !prev),
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

    const unseenNotifications = Array.from(followRequestNotifications.values()).filter((n) => !n.seen);

    const renderMenuButton = (item: Item) => {
        if (item.onClick) {
            return (
                <SidebarMenuButton onClick={item.onClick} className="flex justify-center xl:justify-start [&>svg]:size-6">
                    <item.icon />
                    <span className="hidden xl:inline">{item.title}</span>
                    {unseenNotifications.length > 0 && item.title === 'Notifications' && (
                        <Badge variant="destructive" className="ml-auto">
                            {unseenNotifications.length}
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
                data-state={!isSidebarVisible ? 'closed' : 'open'}
                className={`z-52 fixed inset-y-0 left-0 w-52 text-white transition-transform duration-500 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0`}
            >
                <SidebarContent className="flex-none lg:flex-1">
                    <SidebarGroup className="w-min lg:w-full">
                        <SidebarGroupContent className="w-min lg:w-full">
                            <SidebarMenu className="w-min flex-row lg:w-full lg:flex-col">
                                {getItems().map((item) => (
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
            <NotificationsSheet open={showNotifications} setOpen={setShowNotification} />
        </div>
    );
};

export default LeftSidebar;
