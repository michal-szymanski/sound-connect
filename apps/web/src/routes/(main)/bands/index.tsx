import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Plus, Music2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { UserBandCard } from '@/features/bands/components/user-band-card';
import { useUserBands, userBandsQuery } from '@/features/bands/hooks/use-bands';
import { useAuth } from '@/shared/lib/react-query';

export const Route = createFileRoute('/(main)/bands/')({
    component: MyBandsPage,
    loader: async ({ context: { queryClient, user } }) => {
        if (user) {
            await queryClient.ensureQueryData(userBandsQuery(user.id));
        }
    }
});

function MyBandsPage() {
    const { data: auth } = useAuth();
    const navigate = useNavigate();
    const { data: bandsData } = useUserBands(auth?.user?.id ?? '');

    const bands = bandsData?.bands ?? [];
    const adminBands = bands.filter((band) => band.isAdmin);
    const memberBands = bands.filter((band) => !band.isAdmin);
    const sortedBands = [...adminBands, ...memberBands];

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
