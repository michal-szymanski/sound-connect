import { Link, useLocation } from '@tanstack/react-router';
import { Cog, House, LucideIcon, Mail, UserRound } from 'lucide-react';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AccountButton from '@/web/components/small/account-button';
import { useAuth } from '@/web/lib/react-query';
import { collapseSidebar } from '@/web/redux/slices/ui-slice';
import { RootState } from '@/web/redux/store';
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

type Item = {
    title: string;
    url?: string;
    icon: LucideIcon;
    onClick?: () => void;
};

const LeftSidebar = () => {
    const { data: auth } = useAuth();
    const { isSidebarVisible, isSidebarCollapsed } = useSelector((state: RootState) => state.ui);
    const dispatch = useDispatch();
    const location = useLocation();

    const isMessagesPage = location.pathname === '/messages';

    const getItems = (): Item[] => {
        if (!auth?.user) return [];

        return [
            {
                title: 'Home',
                url: '/',
                icon: House
            },
            {
                title: 'Messages',
                url: '/messages',
                icon: Mail
            },
            {
                title: 'Profile',
                url: `/users/${auth.user.id}`,
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
        const isActive = item.url ? location.pathname === item.url : false;

        return (
            <SidebarMenuButton asChild>
                <Link
                    to={item.url}
                    preload={false}
                    className={`flex min-h-12 items-center transition-all duration-300 [&>svg]:size-6 ${
                        isSidebarCollapsed ? 'w-16 justify-center' : 'w-full justify-center px-3 xl:justify-start'
                    } ${isActive ? 'bg-primary/10 text-primary' : ''}`}
                >
                    <item.icon className="flex-shrink-0" />
                    <span
                        className={`truncate transition-all duration-300 ${
                            isSidebarCollapsed ? 'w-0 overflow-hidden opacity-0' : 'ml-2 hidden w-auto opacity-100 xl:block'
                        }`}
                    >
                        {item.title}
                    </span>
                </Link>
            </SidebarMenuButton>
        );
    };

    useEffect(() => {
        const shouldCollapse = isMessagesPage;
        dispatch(collapseSidebar(shouldCollapse));
    }, [isMessagesPage, dispatch]);

    return (
        <div className="relative flex">
            <Sidebar
                collapsible="none"
                data-state={!isSidebarVisible ? 'closed' : 'open'}
                className={`fixed inset-y-0 left-0 z-40 overflow-hidden text-white transition-all duration-300 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 ${
                    isSidebarCollapsed ? 'w-16' : 'w-16 xl:w-64'
                }`}
            >
                <SidebarContent className={`flex-none overflow-hidden lg:flex-1 ${isSidebarCollapsed ? 'w-16' : 'w-full'}`}>
                    <SidebarGroup className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-16 px-0' : 'w-full px-2'}`}>
                        <SidebarGroupContent className="overflow-hidden">
                            <SidebarMenu className={`flex-col space-y-1 overflow-hidden ${isSidebarCollapsed ? 'w-16' : 'w-full'}`}>
                                {getItems().map((item) => (
                                    <SidebarMenuItem key={item.title} className={`overflow-hidden ${isSidebarCollapsed ? 'w-16' : 'w-full'}`}>
                                        {renderMenuButton(item)}
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter className={`overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-16 px-0' : 'w-full px-2'}`}>
                    <SidebarMenu className="overflow-hidden">
                        <SidebarMenuItem className={`overflow-hidden ${isSidebarCollapsed ? 'w-16' : 'w-full'}`}>
                            <AccountButton isCollapsed={isSidebarCollapsed} />
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
        </div>
    );
};

export default LeftSidebar;
