// import AccountButton from "@/components/account-button";
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
import { useQuery } from '@tanstack/react-query';
import { userQueryOptions } from '@/web/lib/react-query';

type Item = {
    title: string;
    url: string;
    icon: LucideIcon;
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
        url: '',
        icon: UserRound
    },
    {
        title: 'Settings',
        url: '/settings',
        icon: Cog
    }
];

const LeftSidebar = () => {
    const { data: user } = useQuery(userQueryOptions(null));
    let links = items;

    if (user) {
        links = items.map((item) => (item.title === 'Profile' ? { ...item, url: `/users/${user.id}` } : item));
    }

    return (
        <Sidebar
            collapsible="none"
            className="z-51 fixed bottom-0 h-min w-full flex-row items-center justify-center lg:flex lg:h-full lg:w-min lg:flex-col xl:items-start"
        >
            <SidebarContent className="flex-none lg:flex-1">
                <SidebarGroup className="w-min lg:w-full">
                    <SidebarGroupContent className="w-min lg:w-full">
                        <SidebarMenu className="w-min flex-row lg:w-full lg:flex-col">
                            {links.map((link) => (
                                <SidebarMenuItem key={link.title}>
                                    <SidebarMenuButton asChild>
                                        <Link to={link.url} preload={false} className="flex justify-center xl:justify-start [&>svg]:size-6">
                                            <link.icon />
                                            <span className="hidden xl:inline">{link.title}</span>
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
