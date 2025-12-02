import { cn } from '@/shared/lib/utils';

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div data-slot="skeleton" className={cn('relative overflow-hidden rounded-md bg-accent', className)} {...props}>
            <div className="animate-shimmer absolute inset-0" />
        </div>
    );
}

export { Skeleton };
