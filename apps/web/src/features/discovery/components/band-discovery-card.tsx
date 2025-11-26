import { Link, useNavigate } from '@tanstack/react-router';
import { Users, UserPlus, MapPin } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';
import type { BandDiscoveryResult } from '@sound-connect/common/types/band-discovery';
import { MatchScoreBadge } from './match-score-badge';
import { MatchReasonTag } from './match-reason-tag';

type Props = {
    result: BandDiscoveryResult;
    onCardClick: () => void;
};

export function BandDiscoveryCard({ result, onCardClick }: Props) {
    const navigate = useNavigate();

    const initials = result.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const formatGenre = (genre: string) => {
        return genre
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleClick = () => {
        onCardClick();
        navigate({ to: `/bands/$id`, params: { id: result.id.toString() } });
    };

    const topReasons = result.matchReasons.slice(0, 2);
    const isHighQualityMatch = result.matchScore >= 70;

    return (
        <Card
            className={cn(
                'group focus-visible:ring-ring focus-visible:ring-offset-background cursor-pointer overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2'
            )}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View ${result.name} band profile. ${result.matchScore}% match.`}
        >
            <div
                className={cn(
                    'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                    isHighQualityMatch
                        ? 'to-primary/5 bg-gradient-to-br from-green-500/10 via-transparent'
                        : 'from-primary/5 bg-gradient-to-br via-transparent to-transparent'
                )}
            />
            <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                    <Avatar className="ring-background h-20 w-20 flex-shrink-0 ring-2">
                        <AvatarImage src={result.profileImageUrl || undefined} alt={result.name} />
                        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-lg leading-tight font-semibold">{result.name}</h3>
                            <MatchScoreBadge score={result.matchScore} />
                        </div>
                        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                            {result.primaryGenre && (
                                <Badge variant="secondary" className="text-xs">
                                    {formatGenre(result.primaryGenre)}
                                </Badge>
                            )}
                            {result.city && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {result.city}, {result.state}
                                    <span className="text-muted-foreground/70">({Math.round(result.distanceMiles)} mi)</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-3">
                {topReasons.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {topReasons.map((reason, index) => (
                            <MatchReasonTag key={index} reason={reason} result={result} />
                        ))}
                    </div>
                )}
                {result.lookingFor && (
                    <div>
                        <span className="text-xs font-medium">Looking for:</span>
                        <p className="text-muted-foreground line-clamp-2 text-sm">{result.lookingFor}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex-col gap-3 pt-0">
                <div className="text-muted-foreground flex w-full items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {result.memberCount} {result.memberCount === 1 ? 'member' : 'members'}
                    </span>
                    <span className="flex items-center gap-1">
                        <UserPlus className="h-4 w-4" />
                        {result.followerCount} {result.followerCount === 1 ? 'follower' : 'followers'}
                    </span>
                </div>
                <Button variant="default" size="sm" className="w-full" asChild>
                    <Link to="/bands/$id" params={{ id: result.id.toString() }}>
                        View Band
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
