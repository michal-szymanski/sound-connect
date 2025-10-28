import clsx from 'clsx';
import SignOutButton from '@/web/components/small/sign-out-button';
import UserAvatar from '@/web/components/small/user-avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/web/components/ui/dropdown-menu';
import { SidebarMenuButton } from '@/web/components/ui/sidebar';
import { useUser } from '@/web/lib/react-query';

type Props = {
    isCollapsed: boolean;
};

export const AccountButton = ({ isCollapsed }: Props) => {
    const { data: user } = useUser();

    if (!user) {
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
                    <UserAvatar user={user} className="size-8 flex-shrink-0" fallbackClassName="bg-primary text-primary-foreground" />
                    <span
                        className={clsx('ml-2 hidden w-auto truncate opacity-100 transition-all duration-300 xl:block', {
                            'w-0 overflow-hidden opacity-0': isCollapsed
                        })}
                    >
                        {user.name}
                    </span>
                </DropdownMenuTrigger>
            </SidebarMenuButton>
            <DropdownMenuContent className="z-90" align="end">
                <SignOutButton />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default AccountButton;
