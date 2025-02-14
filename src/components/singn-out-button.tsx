'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useClerk } from '@clerk/nextjs';

const SignOutButton = () => {
    const { signOut } = useClerk();
    return (
        <DropdownMenuItem className="cursor-pointer" onClick={() => signOut()}>
            Log Out
        </DropdownMenuItem>
    );
};

export default SignOutButton;
