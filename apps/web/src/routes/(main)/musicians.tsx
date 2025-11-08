import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';
import { Button } from '@/web/components/ui/button';
import { Alert, AlertDescription } from '@/web/components/ui/alert';
import { Sheet, SheetContent } from '@/web/components/ui/sheet';
import { Badge } from '@/web/components/ui/badge';
import { Card, CardContent } from '@/web/components/ui/card';
import { ProfileSearchFilters } from '@/web/components/profile-search/profile-search-filters';
import { ProfileSearchResults } from '@/web/components/profile-search/profile-search-results';
import { ProfileSearchSkeleton } from '@/web/components/profile-search/profile-search-skeleton';
import { ProfileSearchEmptyState } from '@/web/components/profile-search/profile-search-empty-state';
import { ProfileSearchErrorState } from '@/web/components/profile-search/profile-search-error-state';
import { searchProfiles } from '@/web/server-functions/profile-search';
import type { ProfileSearchParams, ProfileSearchResponse } from '@sound-connect/common/types/profile-search';

export const Route = createFileRoute('/(main)/musicians')({
    component: MusiciansPage
});

function MusiciansPage() {
    const [filters, setFilters] = useState<ProfileSearchParams>({
        page: 1,
        limit: 12
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
    }, [filters]);

    const handleClearFilters = () => {
        setFilters({ page: 1, limit: 12 });
        setResults(null);
        setError(null);
        setHasSearched(false);
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
                    <h2 className="mb-2 text-2xl font-semibold">Find Musicians</h2>
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
