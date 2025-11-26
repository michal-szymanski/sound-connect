import { Badge } from '@/shared/components/ui/badge';
import { NumberTicker } from '@/shared/components/ui/number-ticker';
import { cn } from '@/shared/lib/utils';

type Props = {
    score: number;
};

export function MatchScoreBadge({ score }: Props) {
    const getColorClass = () => {
        if (score >= 70) {
            return 'bg-green-600 text-white hover:bg-green-700';
        }
        if (score >= 50) {
            return 'bg-yellow-600 text-white hover:bg-yellow-700';
        }
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
    };

    const getQualityLabel = () => {
        if (score >= 70) return 'Excellent match';
        if (score >= 50) return 'Good match';
        return 'Fair match';
    };

    const isHighMatch = score >= 70;

    return (
        <Badge
            className={cn(
                getColorClass(),
                isHighMatch && 'shadow-[0_0_15px_rgba(34,197,94,0.5)] motion-safe:animate-pulse-slow'
            )}
            aria-label={getQualityLabel()}
        >
            <NumberTicker value={score} />% Match
        </Badge>
    );
}
