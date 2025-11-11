import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { BandDiscoveryCard } from '@/features/discovery/components/band-discovery-card';
import { BandDiscoveryCardSkeleton } from '@/features/discovery/components/band-discovery-card-skeleton';
import { EmptyDiscoveryState } from '@/features/discovery/components/empty-discovery-state';
import { useDiscoveryAnalytics } from '@/features/discovery/hooks/use-discovery-analytics';
import { getBandDiscovery } from '@/features/discovery/server-functions/band-discovery';
import type { BandDiscoveryResponse } from '@sound-connect/common/types/band-discovery';

export const Route = createFileRoute('/(main)/discover/bands')({
    component: BandDiscoveryPage
});

function BandDiscoveryPage() {
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<BandDiscoveryResponse | null>(null);
    const [isIncompleteProfile, setIsIncompleteProfile] = useState(false);

    const { trackCardClick, trackPagination } = useDiscoveryAnalytics();

    const fetchDiscovery = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await getBandDiscovery({ data: { page, limit: 12 } });

            if (!result.success) {
                setError(result.body?.message ?? 'Failed to fetch band recommendations');
                setData(null);
            } else {
                const responseBody = result.body as BandDiscoveryResponse & {
                    profileStatus?: 'incomplete' | 'not_found';
                    missingFields?: string[];
                };

                if (responseBody.profileStatus === 'incomplete' || responseBody.profileStatus === 'not_found') {
                    setIsIncompleteProfile(true);
                    setData(null);
                } else {
                    setData(result.body);
                    setIsIncompleteProfile(false);
                    setError(null);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchDiscovery();
    }, [fetchDiscovery]);

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        trackPagination(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCardClick = (bandId: number, matchScore: number, positionInFeed: number) => {
        if (data) {
            const band = data.bands[positionInFeed];
            if (band) {
                trackCardClick(bandId, matchScore, band.matchReasons, positionInFeed + 1);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Discover Bands</h1>
                    <p className="text-muted-foreground mt-2">Bands looking for musicians like you</p>
                </div>
                <div className="flex flex-col gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <BandDiscoveryCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (isIncompleteProfile) {
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

    if (error) {
        return (
            <div className="min-h-screen space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Discover Bands</h1>
                    <p className="text-muted-foreground mt-2">Bands looking for musicians like you</p>
                </div>
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={fetchDiscovery}>Retry</Button>
            </div>
        );
    }

    if (!data || data.bands.length === 0) {
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

            <p className="text-muted-foreground text-sm">
                Showing {(page - 1) * 12 + 1}-{Math.min(page * 12, data.pagination.totalResults)} of {data.pagination.totalResults} matches
            </p>

            <div className="flex flex-col gap-4">
                {data.bands.map((band, index) => (
                    <BandDiscoveryCard key={band.id} result={band} onCardClick={() => handleCardClick(band.id, band.matchScore, index)} />
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
