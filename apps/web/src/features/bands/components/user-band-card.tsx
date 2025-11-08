import { Link } from '@tanstack/react-router';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { MapPin, Music2 } from 'lucide-react';
import type { BandMembership } from '@sound-connect/common/types/bands';

type Props = {
    band: BandMembership;
};

export function UserBandCard({ band }: Props) {
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

    const joinedDate = new Date(band.joinedAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
    });

    return (
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        <Link to={`/bands/${band.id}` as any} aria-label={`View ${band.name}`}>
            <Card className="group border-border/40 hover:border-border/60 cursor-pointer overflow-hidden transition-all hover:shadow-lg">
                <CardContent className="p-5">
                    <div className="flex gap-5">
                        <Avatar className="group-hover:ring-primary/20 h-16 w-16 flex-shrink-0 ring-2 ring-transparent transition-all">
                            <AvatarImage src={band.profileImageUrl || undefined} alt={band.name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                            <div className="mb-3 flex items-start justify-between gap-2">
                                <h3 className="text-lg font-semibold">{band.name}</h3>
                                <Badge variant={band.isAdmin ? 'default' : 'secondary'} className="whitespace-nowrap">
                                    {band.isAdmin ? 'Admin' : 'Member'}
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                {band.primaryGenre && (
                                    <Badge variant="outline" className="gap-1">
                                        <Music2 className="h-3 w-3" aria-hidden="true" />
                                        {formatLabel(band.primaryGenre)}
                                    </Badge>
                                )}

                                {band.city && band.state && (
                                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                        <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                                        <span>
                                            {band.city}, {band.state}
                                        </span>
                                    </div>
                                )}

                                <p className="text-muted-foreground text-sm">
                                    {band.isAdmin ? 'Admin' : 'Member'} since {joinedDate}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
