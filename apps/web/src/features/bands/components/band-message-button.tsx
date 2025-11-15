import { Button } from '@/shared/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { BandMember } from '@sound-connect/common/types/bands';
import { toast } from 'sonner';
import { useAuth } from '@/shared/lib/react-query';

type Props = {
    bandId: number;
    bandName: string;
    bandMembers: BandMember[];
};

export function BandMessageButton({ bandId }: Props) {
    const navigate = useNavigate();
    const { data: auth } = useAuth();

    const handleClick = () => {
        if (!auth?.user) {
            toast.error('You must be logged in to send a message.');
            return;
        }

        const roomId = `band:${bandId}`;
        navigate({ to: '/messages', search: { room: roomId } });
    };

    return (
        <Button variant="outline" size="sm" onClick={handleClick}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Message
        </Button>
    );
}
