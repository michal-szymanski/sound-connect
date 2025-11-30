import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Music2, Pencil, Users } from 'lucide-react';
import { BandFollowButton } from './band-follow-button';
import { BandMessageButton } from './band-message-button';
import { BandFollowersModal } from './band-followers-modal';
import { EditableBandAvatar } from './editable-band-avatar';
import { useBandFollowerCount } from '@/features/bands/hooks/use-bands';
import type { BandWithMembers } from '@sound-connect/common/types/bands';

type Props = {
    band: BandWithMembers;
    isUserAdmin: boolean;
    isUserMember?: boolean;
    onEdit: () => void;
};

export function BandHeader({ band, isUserAdmin, isUserMember, onEdit }: Props) {
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const { data: followerCountData } = useBandFollowerCount(band.id);

    const followerCount = followerCountData?.count ?? 0;
    const isUserBandMember = isUserMember ?? false;

    const initials = band.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const formatLabel = (value: string) => {
        return value
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <>
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                    {isUserAdmin ? (
                        <EditableBandAvatar
                            bandId={band.id}
                            currentImage={band.profileImageUrl}
                            bandName={band.name}
                        />
                    ) : (
                        <Avatar className="h-20 w-20 flex-shrink-0 rounded-lg sm:h-24 sm:w-24">
                            <AvatarImage src={band.profileImageUrl || undefined} alt={band.name} />
                            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                        </Avatar>
                    )}

                    <div className="min-w-0 flex-1 space-y-2">
                        <h1 className="text-2xl font-bold sm:text-3xl">{band.name}</h1>

                        <button
                            onClick={() => setShowFollowersModal(true)}
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
                        >
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{followerCount}</span>
                            <span>{followerCount === 1 ? 'follower' : 'followers'}</span>
                        </button>

                        <div className="flex flex-wrap gap-2">
                            {band.city && band.state && (
                                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                    <span>
                                        {band.city}, {band.state}
                                        {band.country && band.country !== 'USA' && `, ${band.country}`}
                                    </span>
                                </div>
                            )}

                            {band.primaryGenre && (
                                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                                    <Music2 className="h-4 w-4 flex-shrink-0" />
                                    <Badge variant="outline">{formatLabel(band.primaryGenre)}</Badge>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {isUserAdmin && (
                        <Button variant="outline" size="sm" onClick={onEdit} aria-label="Edit band">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Band
                        </Button>
                    )}
                    {!isUserBandMember && <BandFollowButton bandId={band.id} />}
                    <BandMessageButton bandId={band.id} bandName={band.name} bandMembers={band.members} />
                </div>
            </div>

            <BandFollowersModal bandId={band.id} open={showFollowersModal} onOpenChange={setShowFollowersModal} />
        </>
    );
}
