'use client';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';

const SignOutButton = () => {
    const { signOut } = useClerk();
    return (
        <DropdownMenuItem className="min-w-46 cursor-pointer" onClick={() => signOut()}>
            <LogOut />
            Log Out
        </DropdownMenuItem>
    );
};

export default SignOutButton;
