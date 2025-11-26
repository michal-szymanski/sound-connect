import { Skeleton } from '@/shared/components/ui/skeleton';

export function MessageSkeleton() {
    return (
        <div className="space-y-4 p-4">
            <div className="flex items-start gap-2">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full max-w-xs rounded-lg" />
                </div>
            </div>
            <div className="flex items-start justify-end gap-2">
                <div className="flex flex-1 flex-col items-end space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-full max-w-xs rounded-lg" />
                </div>
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            </div>
            <div className="flex items-start gap-2">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full max-w-md rounded-lg" />
                </div>
            </div>
        </div>
    );
}
