import SignOutButton from '@/web/components/small/sign-out-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/web/components/ui/avatar';
import { Button } from '@/web/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/web/components/ui/dropdown-menu';
import { useUser } from '@/web/lib/react-query';
import { DEFAULT_AVATAR_URL } from '@sound-connect/common/constants';
import { SidebarMenuButton } from '@/web/components/ui/sidebar';

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
                    className={`flex min-h-12 items-center overflow-hidden transition-all duration-300 ${
                        isCollapsed ? 'w-16 justify-center' : 'w-full justify-center px-3 xl:justify-start'
                    }`}
                >
                    <Avatar className="size-8 flex-shrink-0">
                        <AvatarImage src={user.image ?? DEFAULT_AVATAR_URL} />
                        <AvatarFallback className="bg-primary text-primary-foreground">{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <span
                        className={`truncate transition-all duration-300 ${
                            isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'ml-2 hidden w-auto opacity-100 xl:block'
                        }`}
                    >
                        {user.name}
                    </span>
                </DropdownMenuTrigger>
            </SidebarMenuButton>
            <DropdownMenuContent className="z-52" align="start">
                <SignOutButton />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default AccountButton;
