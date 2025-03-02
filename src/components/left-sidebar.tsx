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
import { Bell, House, UserRound } from 'lucide-react';
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
        title: 'Profile',
        url: '/profile',
        icon: UserRound
    }
];

const LeftSidebar = () => {
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
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
