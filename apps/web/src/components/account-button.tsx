import SignOutButton from '@/web/components/sign-out-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/web//components/ui/avatar';
import { Button } from '@/web//components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/web//components/ui/dropdown-menu';
import { Skeleton } from '@/web//components/ui/skeleton';
import { userQueryOptions } from '@/web//lib/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import consts from '@/web/lib/consts';

const AccountButton = () => {
    const { data: user } = useSuspenseQuery(userQueryOptions(null));

    if (!user) return null;

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="focus-visible:outline-hidden h-full max-h-fit w-full cursor-pointer select-none justify-start focus-visible:ring-0"
                >
                    <Avatar className="size-10">
                        <AvatarImage src={user.image ?? consts.SHADCN_DEFAULT_AVATAR} />
                        <AvatarFallback>
                            <Skeleton />
                        </AvatarFallback>
                    </Avatar>
                    <span className="hidden xl:inline">{user.name}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-51" align="start">
                <SignOutButton />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default AccountButton;
