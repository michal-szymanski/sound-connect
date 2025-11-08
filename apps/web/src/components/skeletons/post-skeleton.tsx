import { Card, CardFooter } from '@/web/components/ui/card';
import { Skeleton } from '@/web/components/ui/skeleton';

export function PostSkeleton() {
    return (
        <Card className="border-border/40 w-full overflow-hidden">
            <div className="flex items-start justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
                <Skeleton className="h-8 w-8" />
            </div>
            <div className="px-4 pb-3">
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="mb-2 h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
            </div>
            <CardFooter className="border-border flex min-h-[44px] items-center justify-between border-t px-4 py-0">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 w-6" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 w-6" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-4 w-6" />
                </div>
            </CardFooter>
        </Card>
    );
}
