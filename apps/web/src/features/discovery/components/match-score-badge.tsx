import { Badge } from '@/shared/components/ui/badge';

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

    return (
        <Badge className={getColorClass()} aria-label={getQualityLabel()}>
            {score}% Match
        </Badge>
    );
}
