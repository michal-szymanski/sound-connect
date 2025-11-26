import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Sheet, SheetContent } from '@/shared/components/ui/sheet';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { WordRotate } from '@/shared/components/ui/word-rotate';
import { ProfileSearchFilters } from '@/features/search/components/profile-search/profile-search-filters';
import { ProfileSearchResults } from '@/features/search/components/profile-search/profile-search-results';
import { ProfileSearchSkeleton } from '@/features/search/components/profile-search/profile-search-skeleton';
import { ProfileSearchEmptyState } from '@/features/search/components/profile-search/profile-search-empty-state';
import { ProfileSearchErrorState } from '@/features/search/components/profile-search/profile-search-error-state';
import { searchProfiles } from '@/features/search/server-functions/profile-search';
import type { ProfileSearchParams, ProfileSearchResponse } from '@sound-connect/common/types/profile-search';

export const Route = createFileRoute('/(main)/musicians')({
    component: MusiciansPage,
    validateSearch: (search: Record<string, unknown>) => {
        return {
            city: search['city'] as string | undefined,
            instruments: search['instruments'] ? (Array.isArray(search['instruments']) ? search['instruments'] : [search['instruments']]) : undefined,
            genres: search['genres'] ? (Array.isArray(search['genres']) ? search['genres'] : [search['genres']]) : undefined,
            availabilityStatus: search['availabilityStatus']
                ? Array.isArray(search['availabilityStatus'])
                    ? search['availabilityStatus']
                    : [search['availabilityStatus']]
                : undefined,
            radius: search['radius'] ? Number(search['radius']) : undefined,
            page: search['page'] ? Number(search['page']) : 1,
            limit: 12
        } as ProfileSearchParams;
    }
});

function MusiciansPage() {
    const searchParams = Route.useSearch();
    const navigate = useNavigate();

    const [filters, setFilters] = useState<ProfileSearchParams>({
        page: searchParams.page || 1,
        limit: 12,
        city: searchParams.city,
        instruments: searchParams.instruments,
        genres: searchParams.genres,
        availabilityStatus: searchParams.availabilityStatus,
        radius: searchParams.radius
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ProfileSearchResponse | null>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [filterSlot, setFilterSlot] = useState<HTMLElement | null>(null);

    const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        setFilterSlot(document.getElementById('musicians-filters-slot'));
    }, []);

    const handleSearch = useCallback(async () => {
        window.scrollTo(0, 0);
        setIsLoading(true);
        setError(null);
        setHasSearched(true);

        navigate({
            to: '/musicians',
            search: {
                city: filters.city,
                instruments: filters.instruments,
                genres: filters.genres,
                availabilityStatus: filters.availabilityStatus,
                radius: filters.radius,
                page: filters.page,
                limit: 12
            },
            replace: true
        });

        try {
            const searchParams = {
                ...filters,
                radius: filters.radius?.toString() as '5' | '10' | '25' | '50' | '100' | undefined
            };
            const result = await searchProfiles({ data: searchParams });

            if (!result.success) {
                setError(result.body?.message ?? 'Failed to fetch search results');
                setResults(null);
            } else {
                setResults(result.body);
                setError(null);

                setTimeout(() => {
                    resultsHeadingRef.current?.focus();
                }, 100);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            setResults(null);
        } finally {
            setIsLoading(false);
        }
    }, [filters, navigate]);

    const handleClearFilters = () => {
        setFilters({ page: 1, limit: 12 });
        setResults(null);
        setError(null);
        setHasSearched(false);

        navigate({
            to: '/musicians',
            search: {
                page: 1,
                limit: 12
            },
            replace: true
        });
    };

    const handlePageChange = (page: number) => {
        setFilters({ ...filters, page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        if (filters.page !== 1 && hasSearched) {
            handleSearch();
        }
    }, [filters.page, hasSearched, handleSearch]);

    useEffect(() => {
        const hasUrlFilters = searchParams.city || searchParams.instruments?.length || searchParams.genres?.length || searchParams.availabilityStatus?.length;

        if (hasUrlFilters && !hasSearched) {
            handleSearch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const activeFilterCount = [
        filters.instruments && filters.instruments.length > 0,
        filters.genres && filters.genres.length > 0,
        filters.city,
        filters.availabilityStatus && filters.availabilityStatus.length > 0
    ].filter(Boolean).length;

    const filtersComponent = (
        <Card className="border-border/40">
            <CardContent className="p-4">
                <ProfileSearchFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onSearch={handleSearch}
                    onClear={handleClearFilters}
                    isLoading={isLoading}
                    activeFilterCount={activeFilterCount}
                />
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen space-y-6">
            {filterSlot && createPortal(filtersComponent, filterSlot)}

            <div className="mb-4 lg:hidden">
                <Button onClick={() => setIsFiltersOpen(true)} variant="outline" className="relative w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                        <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </div>

            {results?.geocodingFallback && (
                <Alert>
                    <AlertDescription>Location search is temporarily unavailable. Showing results based on city name only.</AlertDescription>
                </Alert>
            )}

            {hasSearched && results && (
                <h2 className="text-lg font-semibold" tabIndex={-1} ref={resultsHeadingRef} aria-live="polite">
                    {results.pagination.total} {results.pagination.total === 1 ? 'musician' : 'musicians'} found
                </h2>
            )}

            {!hasSearched && (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <Filter className="text-muted-foreground mb-4 h-16 w-16" />
                    <h2 className="mb-2 text-2xl font-semibold">
                        Find your next{' '}
                        <WordRotate words={['drummer', 'guitarist', 'vocalist', 'bandmate']} duration={3000} className="text-primary inline-block" loop={false} />
                    </h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Use the filters to search for musicians by instrument, location, genre, and availability status.
                    </p>
                    <Button onClick={handleSearch} size="lg">
                        Show All Musicians
                    </Button>
                </div>
            )}

            {isLoading && <ProfileSearchSkeleton />}

            {error && hasSearched && <ProfileSearchErrorState onRetry={handleSearch} error={error} />}

            {!isLoading && !error && hasSearched && results && results.results.length === 0 && <ProfileSearchEmptyState onClearFilters={handleClearFilters} />}

            {!isLoading && !error && hasSearched && results && results.results.length > 0 && (
                <ProfileSearchResults results={results} onPageChange={handlePageChange} />
            )}

            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                    <ProfileSearchFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                        onSearch={() => {
                            handleSearch();
                            setIsFiltersOpen(false);
                        }}
                        onClear={handleClearFilters}
                        isLoading={isLoading}
                        activeFilterCount={activeFilterCount}
                    />
                </SheetContent>
            </Sheet>
        </div>
    );
}
