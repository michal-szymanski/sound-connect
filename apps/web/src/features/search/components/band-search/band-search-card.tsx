import { useNavigate } from '@tanstack/react-router';
import { Music, MapPin, Users } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import type { BandSearchResult } from '@sound-connect/common/types/band-search';

type Props = {
    result: BandSearchResult;
};

export function BandSearchCard({ result }: Props) {
    const navigate = useNavigate();

    const initials = result.name
        .split(' ')
        .map((n: string) => n[0])
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
        <Card className="w-full overflow-hidden transition-shadow hover:shadow-lg">
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar className="h-16 w-16 flex-shrink-0">
                        <AvatarImage src={result.profileImageUrl || undefined} alt={result.name} />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold">{result.name}</h3>
                            <Badge variant="outline" className="gap-1 whitespace-nowrap">
                                <Users className="h-3 w-3" />
                                {result.memberCount} {result.memberCount === 1 ? 'member' : 'members'}
                            </Badge>
                        </div>

                        {result.primaryGenre && (
                            <div className="text-muted-foreground flex items-center gap-1 text-sm">
                                <Music className="h-4 w-4 flex-shrink-0" />
                                <span>{formatLabel(result.primaryGenre)}</span>
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

                        {result.description && <p className="text-muted-foreground line-clamp-2 text-sm">{result.description}</p>}

                        {result.lookingFor && (
                            <div className="mt-1">
                                <span className="text-xs font-medium">Looking for:</span>
                                <p className="text-muted-foreground text-sm">{result.lookingFor}</p>
                            </div>
                        )}

                        <div className="mt-2 flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => navigate({ to: `/profile/$username`, params: { username: result.username } })}
                            >
                                View Band
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
