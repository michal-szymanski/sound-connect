import { Skeleton } from '@/web/components/ui/skeleton';
import { Card, CardContent } from '@/web/components/ui/card';

export function ProfileSearchSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-7 w-48" />
            <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className="w-full overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex gap-4">
                                <Skeleton className="h-16 w-16 flex-shrink-0 rounded-full" />
                                <div className="flex min-w-0 flex-1 flex-col gap-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Skeleton className="h-6 w-32" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-4 w-40" />
                                    <div className="flex flex-wrap gap-1">
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-5 w-14" />
                                    </div>
                                    <div className="mt-1">
                                        <div className="mb-1 flex justify-between">
                                            <Skeleton className="h-3 w-28" />
                                            <Skeleton className="h-3 w-8" />
                                        </div>
                                        <Skeleton className="h-2 w-full" />
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        <Skeleton className="h-8 flex-1" />
                                        <Skeleton className="h-8 flex-1" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
