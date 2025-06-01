import { DropdownMenuItem } from '@/web/components/ui/dropdown-menu';
import { signOut } from '@/web/server-functions/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

const SignOutButton = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleSignOut = async () => {
        const result = await signOut();

        if (result.success) {
            queryClient.clear();
            router.navigate({ to: '/sign-in' });
        } else if (result.body) {
            toast.error('Could not sign out', {
                description: result.body.message
            });
        }
    };

    return (
        <DropdownMenuItem className="min-w-46 cursor-pointer" onClick={handleSignOut}>
            <LogOut />
            Log Out
        </DropdownMenuItem>
    );
};

export default SignOutButton;
