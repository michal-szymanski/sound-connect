import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { BlurFade } from '@/shared/components/ui/blur-fade';
import { BandDiscoveryCard } from '@/features/discovery/components/band-discovery-card';
import { EmptyDiscoveryState } from '@/features/discovery/components/empty-discovery-state';
import { useDiscoveryAnalytics } from '@/features/discovery/hooks/use-discovery-analytics';
import { getBandDiscovery } from '@/features/discovery/server-functions/band-discovery';
import type { BandDiscoveryResponse } from '@sound-connect/common/types/band-discovery';

const bandDiscoverySearchSchema = z.object({
    page: z.coerce.number().positive().int().catch(1).default(1)
});

export const Route = createFileRoute('/(main)/discover/bands')({
    component: BandDiscoveryPage,
    validateSearch: bandDiscoverySearchSchema,
    loaderDeps: ({ search }) => ({ page: search.page }),
    loader: async ({ deps }) => {
        const result = await getBandDiscovery({ data: { page: deps.page, limit: 12 } });

        if (!result.success) {
            return {
                type: 'error' as const,
                message: result.body?.message ?? 'Failed to fetch band recommendations'
            };
        }

        const responseBody = result.body as BandDiscoveryResponse & {
            profileStatus?: 'incomplete' | 'not_found';
            missingFields?: string[];
        };

        if (responseBody.profileStatus === 'incomplete' || responseBody.profileStatus === 'not_found') {
            return {
                type: 'incomplete-profile' as const,
                message: 'Please complete your profile to get personalized band recommendations'
            };
        }

        return {
            type: 'success' as const,
            data: result.body
        };
    }
});

function BandDiscoveryPage() {
    const loaderData = Route.useLoaderData();
    const { page } = Route.useSearch();
    const navigate = useNavigate({ from: Route.fullPath });
    const { trackCardClick, trackPagination } = useDiscoveryAnalytics();

    const handlePageChange = (newPage: number) => {
        trackPagination(newPage);
        navigate({ search: { page: newPage } });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCardClick = (bandId: number, matchScore: number, positionInFeed: number, data: BandDiscoveryResponse) => {
        const band = data.bands[positionInFeed];
        if (band) {
            trackCardClick(bandId, matchScore, band.matchReasons, positionInFeed + 1);
        }
    };

    if (loaderData.type === 'incomplete-profile') {
        return (
            <div className="min-h-screen space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Discover Bands</h1>
                    <p className="text-muted-foreground mt-2">Bands looking for musicians like you</p>
                </div>
                <EmptyDiscoveryState type="incomplete-profile" />
            </div>
        );
    }

    if (loaderData.type === 'error') {
        return (
            <div className="min-h-screen space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Discover Bands</h1>
                    <p className="text-muted-foreground mt-2">Bands looking for musicians like you</p>
                </div>
                <Alert variant="destructive">
                    <AlertDescription>{loaderData.message}</AlertDescription>
                </Alert>
                <Button onClick={() => navigate({ search: { page } })}>Retry</Button>
            </div>
        );
    }

    const data = loaderData.data;

    if (data.bands.length === 0) {
        return (
            <div className="min-h-screen space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Discover Bands</h1>
                    <p className="text-muted-foreground mt-2">Bands looking for musicians like you</p>
                </div>
                <EmptyDiscoveryState type="no-matches" />
            </div>
        );
    }

    return (
        <div className="min-h-screen space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Discover Bands</h1>
                <p className="text-muted-foreground mt-2">Bands looking for musicians like you</p>
            </div>

            <p className="text-muted-foreground text-sm" aria-live="polite">
                Showing {(page - 1) * 12 + 1}-{Math.min(page * 12, data.pagination.totalResults)} of {data.pagination.totalResults} matches
            </p>

            <div className="flex flex-col gap-4">
                {data.bands.map((band, index) => (
                    <BlurFade key={band.id} delay={0.05 + index * 0.03} inView className="motion-reduce:animate-none">
                        <BandDiscoveryCard result={band} onCardClick={() => handleCardClick(band.id, band.matchScore, index, data)} />
                    </BlurFade>
                ))}
            </div>

            {data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={!data.pagination.hasPreviousPage}>
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <span className="text-muted-foreground px-4 text-sm">
                        Page {data.pagination.currentPage} of {data.pagination.totalPages}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={!data.pagination.hasNextPage}>
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
