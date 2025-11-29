import { AlertCircle } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';

type Props = {
    status: 'required';
};

export const CompletionBadge = ({ status: _status }: Props) => {
    return (
        <Badge variant="outline" className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-500" aria-label="This section is required">
            <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Required</span>
        </Badge>
    );
};
