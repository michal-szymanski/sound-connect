import { Clock, Check, AlertCircle, RotateCcw } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import clsx from 'clsx';

type Props = {
    status: 'sending' | 'sent' | 'error';
    onRetry?: () => void;
};

export function MessageStatusIndicator({ status, onRetry }: Props) {
    const [hidePhase, setHidePhase] = useState<'visible' | 'fading' | 'hidden'>('visible');
    const fadeInitiatedRef = useRef(false);

    useEffect(() => {
        if (status !== 'sent') {
            fadeInitiatedRef.current = false;
            return;
        }

        if (fadeInitiatedRef.current) {
            return;
        }

        fadeInitiatedRef.current = true;

        const fadeOutTimer = setTimeout(() => {
            setHidePhase('fading');
        }, 5000);

        const unmountTimer = setTimeout(() => {
            setHidePhase('hidden');
        }, 5300);

        return () => {
            clearTimeout(fadeOutTimer);
            clearTimeout(unmountTimer);
        };
    }, [status]);

    if (status === 'sent' && hidePhase === 'hidden') {
        return null;
    }

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
                    'text-muted-foreground/70 mt-1 flex items-center gap-1.5 px-1 text-xs transition-opacity',
                    hidePhase === 'visible' ? 'animate-in fade-in duration-200' : '',
                    hidePhase === 'fading' ? 'opacity-0 duration-300' : 'opacity-100'
                )}
            >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sent</span>
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
