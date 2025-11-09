import { Button } from '@/shared/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { BandMember } from '@sound-connect/common/types/bands';
import { toast } from 'sonner';

type Props = {
    bandId: number;
    bandName: string;
    bandMembers: BandMember[];
};

export function BandMessageButton({ bandMembers }: Props) {
    const navigate = useNavigate();

    const handleClick = () => {
        const admins = bandMembers.filter((member) => member.isAdmin);

        if (admins.length === 0) {
            toast.error('This band has no admins. Cannot send message.');
            return;
        }

        const firstAdmin = admins.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())[0];

        if (!firstAdmin) {
            toast.error('Could not find band admin.');
            return;
        }

        navigate({ to: '/messages', search: { userId: firstAdmin.userId } });
    };

    return (
        <Button variant="outline" size="sm" onClick={handleClick}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Message
        </Button>
    );
}
