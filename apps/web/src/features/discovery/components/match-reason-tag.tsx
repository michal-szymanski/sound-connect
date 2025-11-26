import { Guitar, Music, MapPin } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import type { MatchReason } from '@sound-connect/common/types/band-discovery';
import type { BandDiscoveryResult } from '@sound-connect/common/types/band-discovery';

type Props = {
    reason: MatchReason;
    result?: BandDiscoveryResult;
};

export function MatchReasonTag({ reason, result }: Props) {
    const getIcon = () => {
        switch (reason.type) {
            case 'instrument':
                return <Guitar className="h-3 w-3" />;
            case 'genre':
                return <Music className="h-3 w-3" />;
            case 'location':
                return <MapPin className="h-3 w-3" />;
        }
    };

    const getColorClass = () => {
        switch (reason.type) {
            case 'instrument':
                return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'genre':
                return 'border-purple-300 bg-white text-purple-700 dark:border-purple-800 dark:bg-transparent dark:text-purple-300';
            case 'location':
                return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700';
        }
    };

    const getReasonDescription = () => {
        if (reason.type === 'instrument') {
            return `They're looking for a ${reason.label.toLowerCase()} - your primary instrument!`;
        }
        if (reason.type === 'genre') {
            return `You both play ${reason.label} music`;
        }
        if (reason.type === 'location' && result) {
            return `Only ${Math.round(result.distanceMiles)} miles from your location`;
        }
        return reason.label;
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Badge variant="outline" className={cn('gap-1 transition-all duration-200 hover:scale-105', getColorClass())}>
                    {getIcon()}
                    <span>{reason.label}</span>
                </Badge>
            </TooltipTrigger>
            <TooltipContent className="z-tooltip">
                <p className="text-xs">{getReasonDescription()}</p>
            </TooltipContent>
        </Tooltip>
    );
}
