import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenuItem } from '@/shared/components/ui/dropdown-menu';
import { signOut } from '@/features/auth/server-functions/auth';

const SignOutButton = () => {
    const handleSignOut = async () => {
        try {
            const result = await signOut();

            if (result.success) {
                window.location.href = '/sign-in';
            } else if (result.body) {
                toast.error('Could not sign out', {
                    description: result.body.message
                });
            }
        } catch {
            window.location.href = '/sign-in';
        }
    };

    return (
        <DropdownMenuItem data-testid="sign-out-button" className="min-w-46 cursor-pointer" onClick={handleSignOut}>
            <LogOut />
            Log Out
        </DropdownMenuItem>
    );
};

export default SignOutButton;
