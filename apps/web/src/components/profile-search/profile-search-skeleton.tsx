import { Skeleton } from '@/web/components/ui/skeleton';
import { Card, CardContent } from '@/web/components/ui/card';

export function ProfileSearchSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i}>
                    <CardContent className="space-y-3 p-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-9 flex-1" />
                            <Skeleton className="h-9 flex-1" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
