import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function BandSearchSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="w-full overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <Skeleton className="h-16 w-16 flex-shrink-0 rounded-full" />
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <div className="mt-1">
                                    <Skeleton className="mb-1 h-3 w-20" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                                <div className="mt-2">
                                    <Skeleton className="h-8 w-24" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
