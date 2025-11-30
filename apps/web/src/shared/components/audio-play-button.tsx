import { Play, Pause } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type Props = {
    isPlaying: boolean;
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'minimal';
    disabled?: boolean;
    className?: string;
    'aria-label': string;
};

export function AudioPlayButton({ isPlaying, onClick, size = 'md', variant = 'default', disabled = false, className, 'aria-label': ariaLabel }: Props) {
    const sizeClasses = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12'
    };

    const iconSizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
    };

    const variantClasses = {
        default: cn(
            'rounded-full border transition-colors',
            'bg-background',
            isPlaying ? 'border-primary' : 'border-border',
            !disabled && 'hover:border-primary hover:bg-primary/20'
        ),
        minimal: cn(
            'rounded-full transition-colors',
            isPlaying ? 'text-primary' : 'text-muted-foreground',
            !disabled && 'hover:text-primary hover:bg-primary/10'
        )
    };

    const iconColorClass = variant === 'default' ? 'text-primary' : undefined;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex shrink-0 items-center justify-center',
                sizeClasses[size],
                variantClasses[variant],
                disabled && 'cursor-not-allowed opacity-50',
                className
            )}
            aria-label={ariaLabel}
            type="button"
        >
            {isPlaying ? (
                <Pause className={cn(iconSizeClasses[size], iconColorClass)} aria-hidden="true" />
            ) : (
                <Play className={cn(iconSizeClasses[size], iconColorClass)} aria-hidden="true" />
            )}
        </button>
    );
}
