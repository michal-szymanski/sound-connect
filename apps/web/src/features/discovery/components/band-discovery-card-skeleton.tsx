import { Card, CardContent, CardFooter, CardHeader } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

export function BandDiscoveryCardSkeleton() {
    return (
        <Card className="w-full overflow-hidden">
            <CardHeader className="space-y-2 pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter className="justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
            </CardFooter>
        </Card>
    );
}
