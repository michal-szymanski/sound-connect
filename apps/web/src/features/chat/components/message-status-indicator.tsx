import { Clock, Check, AlertCircle, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import clsx from 'clsx';

type Props = {
    status: 'sending' | 'sent' | 'error';
    onRetry?: () => void;
    messageId: string;
};

export function MessageStatusIndicator({ status, onRetry, messageId: _messageId }: Props) {
    const [shouldHide, setShouldHide] = useState(false);

    useEffect(() => {
        if (status !== 'sent') {
            return;
        }

        const timer = setTimeout(() => {
            setShouldHide(true);
        }, 5000);

        return () => {
            clearTimeout(timer);
            setShouldHide(false);
        };
    }, [status]);

    if (shouldHide) return null;

    if (status === 'sending') {
        return (
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="animate-in fade-in text-muted-foreground mt-1 flex items-center gap-1.5 px-1 text-xs duration-200"
            >
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sending</span>
            </div>
        );
    }

    if (status === 'sent') {
        return (
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={clsx(
                    'text-muted-foreground/70 mt-1 flex items-center gap-1.5 px-1 text-xs',
                    shouldHide ? 'animate-out fade-out duration-300' : 'animate-in fade-in duration-200'
                )}
            >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">Message sent successfully</span>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="animate-in fade-in text-destructive mt-1.5 flex items-center gap-1.5 px-1 text-xs duration-200"
            >
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Failed to send</span>
                {onRetry && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetry()}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 gap-1 px-3 md:h-6 md:px-2"
                        aria-label="Retry sending message"
                    >
                        <RotateCcw className="h-3 w-3" aria-hidden="true" />
                        <span className="font-medium">Retry</span>
                    </Button>
                )}
            </div>
        );
    }

    return null;
}
