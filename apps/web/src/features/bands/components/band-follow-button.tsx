import { useState } from 'react';
import { useFollowBand, useUnfollowBand, useIsFollowingBand, useUserBands } from '@/features/bands/hooks/use-bands';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/lib/react-query';

type Props = {
    bandId: number;
};

export function BandFollowButton({ bandId }: Props) {
    const { data: auth } = useAuth();
    const { data: userBands } = useUserBands(auth?.user?.id ?? '');
    const { data: followingData, isLoading } = useIsFollowingBand(bandId);
    const [isHovered, setIsHovered] = useState(false);
    const followMutation = useFollowBand(bandId);
    const unfollowMutation = useUnfollowBand(bandId);

    const isMember = userBands?.bands.some((membership) => membership.id === bandId) ?? false;
    const isFollowing = followingData?.isFollowing ?? false;
    const isPending = followMutation.isPending || unfollowMutation.isPending;

    const handleClick = () => {
        if (isFollowing) {
            unfollowMutation.mutate();
        } else {
            followMutation.mutate();
        }
    };

    if (isLoading) {
        return (
            <Button variant="outline" size="sm" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        );
    }

    if (isMember) {
        return <Badge className="min-w-[100px] justify-center">Member</Badge>;
    }

    return (
        <Button
            variant={isFollowing ? 'outline' : 'default'}
            size="sm"
            onClick={handleClick}
            disabled={isPending}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="min-w-[100px]"
        >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? isHovered ? 'Unfollow' : 'Following' : 'Follow'}
        </Button>
    );
}
