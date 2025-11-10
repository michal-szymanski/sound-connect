import { Card, CardContent } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { AlertCircle, Inbox } from 'lucide-react';
import { useBandApplications } from '@/features/bands/hooks/use-band-applications';
import { BandApplicationCard } from './band-application-card';

type Props = {
    bandId: number;
};

export function BandApplicationsList({ bandId }: Props) {
    const { data, isLoading, error } = useBandApplications(bandId, 'pending');

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="flex gap-4">
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-6 w-48" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <div className="flex gap-2 pt-2">
                                        <Skeleton className="h-9 w-24" />
                                        <Skeleton className="h-9 w-24" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message || 'Failed to load applications'}</AlertDescription>
            </Alert>
        );
    }

    if (!data || data.applications.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
                        <Inbox className="text-muted-foreground h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No pending applications</h3>
                    <p className="text-muted-foreground mt-2 text-center text-sm">Applications will appear here when musicians apply to join your band.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {data.applications.map((application) => (
                <BandApplicationCard key={application.id} application={application} bandId={bandId} />
            ))}
        </div>
    );
}
