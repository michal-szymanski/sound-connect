'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { UserDTO } from '@/types';
import { useRouter } from 'next/navigation';

type Props = {
    userDTO: UserDTO;
};

const ProfileButton = ({ userDTO }: Props) => {
    const router = useRouter();

    return (
        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/user/${userDTO.id}`)}>
            Profile
        </DropdownMenuItem>
    );
};

export default ProfileButton;
