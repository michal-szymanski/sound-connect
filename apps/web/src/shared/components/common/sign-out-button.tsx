import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenuItem } from '@/shared/components/ui/dropdown-menu';
import { signOut } from '@/features/auth/server-functions/auth';

const SignOutButton = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleSignOut = async () => {
        const result = await signOut();

        if (result.success) {
            queryClient.clear();
            await router.invalidate();
        } else if (result.body) {
            toast.error('Could not sign out', {
                description: result.body.message
            });
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
