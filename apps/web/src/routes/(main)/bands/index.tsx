import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Plus, Music2 } from 'lucide-react';
import { Button } from '@/web/components/ui/button';
import { Skeleton } from '@/web/components/ui/skeleton';
import { UserBandCard } from '@/web/components/band/user-band-card';
import { useUserBands } from '@/web/hooks/use-bands';
import { useAuth } from '@/web/lib/react-query';

export const Route = createFileRoute('/(main)/bands/')({
    component: MyBandsPage
});

function MyBandsPage() {
    const { data: auth } = useAuth();
    const navigate = useNavigate();
    const { data: bandsData, isLoading } = useUserBands(auth?.user?.id ?? '');

    const bands = bandsData?.bands ?? [];
    const adminBands = bands.filter((band) => band.isAdmin);
    const memberBands = bands.filter((band) => !band.isAdmin);
    const sortedBands = [...adminBands, ...memberBands];

    if (isLoading) {
        return (
            <div className="flex-1 px-4 py-6">
                <div className="mb-6 flex items-center justify-between">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 px-4 py-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold">My Bands</h1>
                <Button onClick={() => navigate({ to: '/bands/new' })}>
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Create Band
                </Button>
            </div>

            {sortedBands.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-16 text-center">
                    <Music2 className="mb-4 h-16 w-16 opacity-20" aria-hidden="true" />
                    <h2 className="mb-2 text-xl font-semibold">No bands yet</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Create your first band to start connecting with musicians and building your musical network.
                    </p>
                    <Button onClick={() => navigate({ to: '/bands/new' })} size="lg">
                        <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
                        Create Your First Band
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {sortedBands.map((band) => (
                        <UserBandCard key={band.id} band={band} />
                    ))}
                </div>
            )}
        </div>
    );
}
