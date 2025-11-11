import clsx from 'clsx';
import { Link } from '@tanstack/react-router';
import { Settings } from 'lucide-react';
import SignOutButton from '@/shared/components/common/sign-out-button';
import UserAvatar from '@/shared/components/common/user-avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/shared/components/ui/sidebar';
import { useAuth } from '@/shared/lib/react-query';

type Props = {
    isCollapsed: boolean;
};

export const AccountButton = ({ isCollapsed }: Props) => {
    const { data: auth } = useAuth();

    if (!auth?.user) {
        return null;
    }

    return (
        <DropdownMenu modal={false}>
            <SidebarMenuButton asChild>
                <DropdownMenuTrigger
                    data-testid="user-menu"
                    className={`flex min-h-12 items-center overflow-hidden transition-all duration-300 ${
                        isCollapsed ? 'w-16 justify-center' : 'w-full justify-center px-3 xl:justify-start'
                    }`}
                >
                    <UserAvatar user={auth.user} className="size-8 flex-shrink-0" fallbackClassName="bg-primary text-primary-foreground" />
                    <span
                        className={clsx('ml-2 hidden w-auto truncate opacity-100 transition-all duration-300 xl:block', {
                            'w-0 overflow-hidden opacity-0': isCollapsed
                        })}
                    >
                        {auth.user.name}
                    </span>
                </DropdownMenuTrigger>
            </SidebarMenuButton>
            <DropdownMenuContent className="z-popover" align="end">
                <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex w-full cursor-pointer items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutButton />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default AccountButton;
