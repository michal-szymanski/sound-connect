import { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { useMessagingPermission } from '@/features/chat/hooks/use-messaging-permission';
import { useAuth } from '@/shared/lib/react-query';
import { getRoomId } from '@sound-connect/common/helpers';
import { toast } from 'sonner';
import type { UserDTO } from '@sound-connect/common/types/models';

type Props = {
    user: UserDTO;
    variant?: 'default' | 'outline' | 'secondary';
};

export function MessageButton({ user, variant = 'default' }: Props) {
    const { data: auth } = useAuth();
    const navigate = useNavigate();
    const [isNavigating, setIsNavigating] = useState(false);

    const { data: permission, isLoading } = useMessagingPermission({
        targetUserId: user.id,
        enabled: !!auth?.user && auth.user.id !== user.id
    });

    if (!auth?.user || auth.user.id === user.id) {
        return null;
    }

    const handleClick = () => {
        if (!auth?.user) return;

        if (!permission?.canMessage) {
            if (permission?.reason === 'blocked') {
                toast.error('You cannot message this user');
            } else if (permission?.reason === 'privacy') {
                toast.error('This user only accepts messages from followers');
            }
            return;
        }

        setIsNavigating(true);
        const roomId = getRoomId(auth.user.id, user.id);
        navigate({ to: '/messages', search: { room: roomId } });
    };

    const getTooltipText = () => {
        if (isLoading) return 'Checking permission...';
        if (!permission?.canMessage) {
            if (permission?.reason === 'blocked') return 'You cannot message this user';
            if (permission?.reason === 'privacy') return 'This user only accepts messages from followers';
            if (permission?.reason === 'self') return 'You cannot message yourself';
        }
        return 'Send a message';
    };

    const isDisabled = isLoading || !permission?.canMessage || isNavigating;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={variant} onClick={handleClick} disabled={isDisabled} aria-label={`Message ${user.name}`}>
                        {isLoading || isNavigating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                        Message
                    </Button>
                </TooltipTrigger>
                <TooltipContent className="z-tooltip">
                    <p>{getTooltipText()}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
