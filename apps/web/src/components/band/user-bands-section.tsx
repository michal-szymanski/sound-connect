import { Link } from '@tanstack/react-router';
import { Button } from '@/web/components/ui/button';
import { Skeleton } from '@/web/components/ui/skeleton';
import { ProfileSection } from '@/web/components/profile/profile-section';
import { UserBandCard } from '@/web/components/band/user-band-card';
import { useUserBands } from '@/web/hooks/use-bands';
import { Users } from 'lucide-react';

type Props = {
    userId: string;
    isOwnProfile: boolean;
};

export function UserBandsSection({ userId, isOwnProfile }: Props) {
    const { data: userBands, isLoading } = useUserBands(userId);

    if (isLoading) {
        return (
            <ProfileSection title="Bands" icon={<Users className="h-5 w-5" />} canEdit={false} isEmpty={false}>
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </ProfileSection>
        );
    }

    const bands = userBands?.bands || [];
    const isEmpty = bands.length === 0;

    if (!isOwnProfile && isEmpty) {
        return null;
    }

    return (
        <ProfileSection
            title="Bands"
            icon={<Users className="h-5 w-5" />}
            canEdit={false}
            isEmpty={isEmpty}
            emptyMessage={isOwnProfile ? undefined : 'Not in any bands yet'}
        >
            {isEmpty && isOwnProfile ? (
                <div className="text-center">
                    <p className="text-muted-foreground mb-4 text-sm">You&apos;re not in any bands yet. Create a band to get started!</p>
                    <Link to="/bands/new">
                        <Button>Create Band</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {bands.map((band) => (
                        <UserBandCard key={band.id} band={band} />
                    ))}
                </div>
            )}
        </ProfileSection>
    );
}
