import { useNavigate } from '@tanstack/react-router';
import { Music2, MapPin } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/web/components/ui/avatar';
import { Badge } from '@/web/components/ui/badge';
import { Button } from '@/web/components/ui/button';
import { Card, CardContent } from '@/web/components/ui/card';
import { Progress } from '@/web/components/ui/progress';
import { availabilityStatusConfig } from '@/web/lib/utils/availability';
import type { ProfileSearchResult } from '@sound-connect/common/types/profile-search';

type Props = {
    result: ProfileSearchResult;
};

export function ProfileSearchCard({ result }: Props) {
    const navigate = useNavigate();

    const initials = result.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const statusConfig = result.status ? availabilityStatusConfig[result.status] : null;

    const secondaryGenres = result.secondaryGenres ? result.secondaryGenres.split(',').slice(0, 2) : [];

    const genres = [result.primaryGenre, ...secondaryGenres].filter(Boolean).slice(0, 3);

    const formatLabel = (value: string) => {
        return value
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <Card className="h-full transition-shadow hover:shadow-lg">
            <CardContent className="relative flex h-full flex-col p-4">
                {statusConfig && (
                    <Badge variant={statusConfig.badge} className="absolute top-4 right-4 gap-1">
                        <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.label}
                    </Badge>
                )}

                <Avatar className="mb-3 h-20 w-20">
                    <AvatarImage src={result.image || undefined} alt={result.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>

                <h3 className="mb-1 text-lg font-semibold">{result.name}</h3>

                {result.primaryInstrument && (
                    <div className="text-muted-foreground mb-2 flex items-center text-sm">
                        <Music2 className="mr-1 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                            {formatLabel(result.primaryInstrument)}
                            {result.yearsPlayingPrimary && ` • ${result.yearsPlayingPrimary} years`}
                        </span>
                    </div>
                )}

                {result.city && (
                    <div className="text-muted-foreground mb-2 flex items-center text-sm">
                        <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                            {result.city}, {result.state}
                            {result.distance !== null && result.distance !== undefined && ` • ${result.distance.toFixed(1)} mi`}
                        </span>
                    </div>
                )}

                {genres.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                        {genres.map((genre) => (
                            <Badge key={genre} variant="outline" className="text-xs">
                                {formatLabel(genre as string)}
                            </Badge>
                        ))}
                    </div>
                )}

                {result.profileCompletion < 100 && (
                    <div className="mb-3">
                        <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                            <span>Profile Completion</span>
                            <span>{result.profileCompletion}%</span>
                        </div>
                        <Progress value={result.profileCompletion} />
                    </div>
                )}

                <div className="mt-auto flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => navigate({ to: `/users/${result.userId}` })}>
                        View Profile
                    </Button>
                    <Button variant="default" className="flex-1" onClick={() => navigate({ to: '/messages', search: { userId: result.userId } })}>
                        Message
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
