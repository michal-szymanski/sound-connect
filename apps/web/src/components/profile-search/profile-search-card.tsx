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

    const secondaryGenres = result.secondaryGenres
        ? (() => {
              try {
                  const parsed = JSON.parse(result.secondaryGenres);
                  return Array.isArray(parsed) ? parsed.slice(0, 2) : [];
              } catch {
                  return [];
              }
          })()
        : [];

    const genres = [result.primaryGenre, ...secondaryGenres].filter(Boolean).slice(0, 3);

    const formatLabel = (value: string) => {
        return value
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <Card className="w-full overflow-hidden transition-shadow hover:shadow-lg">
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar className="h-16 w-16 flex-shrink-0">
                        <AvatarImage src={result.image || undefined} alt={result.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold">{result.name}</h3>
                            {statusConfig && (
                                <Badge variant={statusConfig.badge} className="gap-1 whitespace-nowrap">
                                    <span className={`h-2 w-2 rounded-full ${statusConfig.dot}`} />
                                    {statusConfig.label}
                                </Badge>
                            )}
                        </div>

                        {result.primaryInstrument && (
                            <div className="text-muted-foreground flex items-center gap-1 text-sm">
                                <Music2 className="h-4 w-4 flex-shrink-0" />
                                <span>
                                    {formatLabel(result.primaryInstrument)}
                                    {result.yearsPlayingPrimary && ` • ${result.yearsPlayingPrimary} years`}
                                </span>
                            </div>
                        )}

                        {result.city && (
                            <div className="text-muted-foreground flex items-center gap-1 text-sm">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span>
                                    {result.city}, {result.state}
                                    {result.distance !== null && result.distance !== undefined && ` • ${result.distance.toFixed(1)} mi`}
                                </span>
                            </div>
                        )}

                        {genres.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {genres.map((genre) => (
                                    <Badge key={genre} variant="outline" className="text-xs">
                                        {formatLabel(genre as string)}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {result.profileCompletion < 100 && (
                            <div className="mt-1">
                                <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                                    <span>Profile Completion</span>
                                    <span>{result.profileCompletion}%</span>
                                </div>
                                <Progress value={result.profileCompletion} />
                            </div>
                        )}

                        <div className="mt-2 flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate({ to: `/users/${result.userId}` })}>
                                View Profile
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="flex-1"
                                onClick={() => navigate({ to: '/messages', search: { userId: result.userId } })}
                            >
                                Message
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
