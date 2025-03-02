import AccountButton from '@/components/account-button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from '@/components/ui/sidebar';
import { Bell, Cog, House, Mail, UserRound } from 'lucide-react';
import Link from 'next/link';

type Item = {
    title: string;
    url: string;
    icon: React.ElementType;
};

const items: Item[] = [
    {
        title: 'Home',
        url: '/',
        icon: House
    },
    {
        title: 'Notifications',
        url: '/notifications',
        icon: Bell
    },
    {
        title: 'Messages',
        url: '/messages',
        icon: Mail
    },
    {
        title: 'Profile',
        url: '/profile',
        icon: UserRound
    },
    {
        title: 'Settings',
        url: '/settings',
        icon: Cog
    }
];

const LeftSidebar = () => {
    return (
        <Sidebar collapsible="none" className="fixed inset-y-0 z-51 w-min">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url} className="flex justify-center xl:justify-start [&>svg]:size-6">
                                            <item.icon />
                                            <span className="hidden xl:inline">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
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
    );
};

export default LeftSidebar;
