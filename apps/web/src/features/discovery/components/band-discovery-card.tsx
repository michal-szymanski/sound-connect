import { useNavigate } from '@tanstack/react-router';
import { Users, Heart } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card';
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
    const hasHighQualityMatch = result.matchScore >= 70;

    return (
        <Card
            className={`group focus-visible:ring-ring w-full cursor-pointer overflow-hidden transition-all hover:scale-[1.01] hover:shadow-lg focus-visible:ring-2 focus-visible:outline-none ${
                hasHighQualityMatch ? 'border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-950/10' : ''
            }`}
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
            <CardHeader className="space-y-2 pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-16 w-16 flex-shrink-0">
                            <AvatarImage src={result.profileImageUrl || undefined} alt={result.name} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg font-semibold">{result.name}</h3>
                    </div>
                    <MatchScoreBadge score={result.matchScore} />
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                    {result.primaryGenre && <span>{formatGenre(result.primaryGenre)}</span>}
                    {result.primaryGenre && result.city && <span>•</span>}
                    {result.city && (
                        <span>
                            {result.city}, {result.state} • {Math.round(result.distanceMiles)} mi
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-3">
                {topReasons.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {topReasons.map((reason, index) => (
                            <MatchReasonTag key={index} reason={reason} />
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
            <CardFooter className="text-muted-foreground justify-between text-sm">
                <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                        {result.memberCount} {result.memberCount === 1 ? 'member' : 'members'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>
                        {result.followerCount} {result.followerCount === 1 ? 'follower' : 'followers'}
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}
