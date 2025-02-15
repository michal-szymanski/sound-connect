import ProfileButton from '@/components/profile-button';
import SignOutButton from '@/components/singn-out-button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { UserDTO } from '@/types';

type Props = {
    userDTO: UserDTO;
};

const AccountButton = ({ userDTO }: Props) => {
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="size-10 select-none rounded-full focus-visible:outline-none focus-visible:ring-0">
                    <Avatar>
                        <AvatarImage src={userDTO.imageUrl} />
                        <AvatarFallback>
                            <Skeleton />
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <ProfileButton userDTO={userDTO} />
                <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <SignOutButton />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default AccountButton;
