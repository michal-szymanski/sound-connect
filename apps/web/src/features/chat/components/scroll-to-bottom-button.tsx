import { ArrowDown } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';

type Props = {
    onClick: () => void;
    unreadCount?: number;
};

export function ScrollToBottomButton({ onClick, unreadCount }: Props) {
    return (
        <div className="animate-in fade-in zoom-in absolute right-4 bottom-4 duration-200">
            <Button variant="secondary" size="icon" onClick={onClick} className="relative shadow-lg transition-transform hover:scale-110">
                <ArrowDown className="h-4 w-4" />
                {unreadCount && unreadCount > 0 ? (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 min-w-5 px-1 text-xs">
                        {unreadCount}
                    </Badge>
                ) : null}
            </Button>
        </div>
    );
}
