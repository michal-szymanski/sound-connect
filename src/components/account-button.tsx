import SignOutButton from '@/components/singn-out-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { userDTOSchema } from '@/types';
import { currentUser } from '@clerk/nextjs/server';

const AccountButton = async () => {
    const user = await currentUser();

    if (!user) return null;

    const userDTO = userDTOSchema.parse({
        id: user.id,
        imageUrl: user.imageUrl,
        firstName: user.firstName,
        lastName: user.lastName
    });

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-full max-h-fit w-full cursor-pointer justify-start select-none focus-visible:ring-0 focus-visible:outline-hidden"
                >
                    <Avatar className="size-10">
                        <AvatarImage src={userDTO.imageUrl} />
                        <AvatarFallback>
                            <Skeleton />
                        </AvatarFallback>
                    </Avatar>
                    <span>{`${user.firstName} ${user.lastName}`}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-max">
                <SignOutButton />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default AccountButton;
