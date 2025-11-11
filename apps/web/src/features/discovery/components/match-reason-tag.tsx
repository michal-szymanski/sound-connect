import { Guitar, Music, MapPin } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import type { MatchReason } from '@sound-connect/common/types/band-discovery';

type Props = {
    reason: MatchReason;
};

export function MatchReasonTag({ reason }: Props) {
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

    return (
        <Badge variant="outline" className={`gap-1 ${getColorClass()}`}>
            {getIcon()}
            <span>{reason.label}</span>
        </Badge>
    );
}
