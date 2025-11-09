import { useState } from 'react';
import { useFollowBand, useUnfollowBand, useIsFollowingBand } from '@/features/bands/hooks/use-bands';
import { Button } from '@/shared/components/ui/button';
import { Loader2 } from 'lucide-react';

type Props = {
    bandId: number;
};

export function BandFollowButton({ bandId }: Props) {
    const { data: followingData, isLoading } = useIsFollowingBand(bandId);
    const [isHovered, setIsHovered] = useState(false);
    const followMutation = useFollowBand(bandId);
    const unfollowMutation = useUnfollowBand(bandId);

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
