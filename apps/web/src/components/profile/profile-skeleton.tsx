import { Card } from '@/web/components/ui/card';
import { Skeleton } from '@/web/components/ui/skeleton';

export const ProfileSkeleton = () => {
    return (
        <div className="space-y-6">
            <Card className="p-6">
                <Skeleton className="mb-2 h-6 w-48" />
                <Skeleton className="h-20 w-full" />
            </Card>

            {Array.from({ length: 7 }).map((_, i) => (
                <Card key={i} className="p-6">
                    <Skeleton className="mb-4 h-5 w-32" />
                    <Skeleton className="mb-2 h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </Card>
            ))}
        </div>
    );
};
