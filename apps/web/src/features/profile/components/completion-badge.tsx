import { CheckCircle2, CircleDashed, AlertCircle } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';

type Props = {
    status: 'complete' | 'incomplete' | 'required';
};

export const CompletionBadge = ({ status }: Props) => {
    const config = {
        complete: {
            icon: CheckCircle2,
            text: 'Complete',
            className: 'border-green-500/30 bg-green-500/10 text-green-500',
            ariaLabel: 'This section is complete'
        },
        incomplete: {
            icon: CircleDashed,
            text: 'Incomplete',
            className: 'border-border bg-accent/50 text-muted-foreground',
            ariaLabel: 'This section is incomplete'
        },
        required: {
            icon: AlertCircle,
            text: 'Required',
            className: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
            ariaLabel: 'This section is required'
        }
    };

    const { icon: Icon, text, className, ariaLabel } = config[status];

    return (
        <Badge variant="outline" className={`gap-1.5 ${className}`} aria-label={ariaLabel}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{text}</span>
        </Badge>
    );
};
