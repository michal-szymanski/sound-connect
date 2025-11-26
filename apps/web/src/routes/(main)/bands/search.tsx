import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Sheet, SheetContent } from '@/shared/components/ui/sheet';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { BandSearchFilters } from '@/features/search/components/band-search/band-search-filters';
import { BandSearchResults } from '@/features/search/components/band-search/band-search-results';
import { BandSearchEmptyState } from '@/features/search/components/band-search/band-search-empty-state';
import { BandSearchErrorState } from '@/features/search/components/band-search/band-search-error-state';
import { searchBands } from '@/features/search/server-functions/band-search';
import { GenreEnum } from '@sound-connect/common/types/profile-enums';
import type { BandSearchParams, BandSearchResponse } from '@sound-connect/common/types/band-search';

const searchParamsSchema = z.object({
    genre: z.enum(GenreEnum).optional(),
    city: z.string().optional(),
    lookingFor: z.string().optional(),
    radius: z.coerce.number().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(12),
    showAll: z.boolean().optional()
});

type LoaderResult = { type: 'success'; data: BandSearchResponse } | { type: 'no-search' } | { type: 'error'; message: string };

export const Route = createFileRoute('/(main)/bands/search')({
    component: BandSearchPage,
    validateSearch: searchParamsSchema,
    loaderDeps: ({ search }) => ({
        genre: search.genre,
        city: search.city,
        lookingFor: search.lookingFor,
        radius: search.radius,
        page: search.page,
        limit: search.limit,
        showAll: search.showAll
    }),
    loader: async ({ deps }): Promise<LoaderResult> => {
        const hasFilters = deps.genre || deps.city || deps.lookingFor;

        if (!hasFilters && !deps.showAll) {
            return { type: 'no-search' };
        }

        try {
            const result = await searchBands({
                data: {
                    page: deps.page,
                    limit: deps.limit,
                    genre: deps.genre,
                    city: deps.city,
                    lookingFor: deps.lookingFor,
                    radius: deps.radius?.toString() as '5' | '10' | '25' | '50' | '100' | undefined
                }
            });

            if (!result.success) {
                return {
                    type: 'error',
                    message: result.body?.message ?? 'Failed to fetch search results'
                };
            }

            return {
                type: 'success',
                data: result.body
            };
        } catch (err) {
            return {
                type: 'error',
                message: err instanceof Error ? err.message : 'An unexpected error occurred'
            };
        }
    }
});

function BandSearchPage() {
    const searchParams = Route.useSearch();
    const loaderData = Route.useLoaderData();
    const navigate = useNavigate();

    const [filters, setFilters] = useState<BandSearchParams>({
        page: searchParams.page || 1,
        limit: 12,
        genre: searchParams.genre,
        city: searchParams.city,
        lookingFor: searchParams.lookingFor,
        radius: searchParams.radius
    });
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [filterSlot, setFilterSlot] = useState<HTMLElement | null>(null);

    const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

    const results = loaderData.type === 'success' ? loaderData.data : null;
    const error = loaderData.type === 'error' ? loaderData.message : null;
    const hasSearched = loaderData.type !== 'no-search';

    useEffect(() => {
        setFilterSlot(document.getElementById('bands-filters-slot'));
    }, []);

    const handleSearch = useCallback(() => {
        window.scrollTo(0, 0);

        navigate({
            to: '/bands/search',
            search: {
                genre: filters.genre,
                city: filters.city,
                lookingFor: filters.lookingFor,
                radius: filters.radius,
                page: filters.page,
                limit: 12,
                showAll: true
            },
            replace: true
        });

        setTimeout(() => {
            resultsHeadingRef.current?.focus();
        }, 100);
    }, [filters, navigate]);

    const handleClearFilters = () => {
        setFilters({ page: 1, limit: 12 });

        navigate({
            to: '/bands/search',
            search: {
                page: 1,
                limit: 12,
                showAll: false
            },
            replace: true
        });
    };

    const handlePageChange = (page: number) => {
        setFilters({ ...filters, page });
        window.scrollTo({ top: 0, behavior: 'smooth' });

        navigate({
            to: '/bands/search',
            search: {
                ...filters,
                page,
                limit: 12
            },
            replace: true
        });
    };

    const activeFilterCount = [filters.genre, filters.city, filters.lookingFor].filter(Boolean).length;

    const filtersComponent = (
        <Card className="border-border/40">
            <CardContent className="p-4">
                <BandSearchFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    onSearch={handleSearch}
                    onClear={handleClearFilters}
                    isLoading={false}
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
                    {results.pagination.total} {results.pagination.total === 1 ? 'band' : 'bands'} found
                </h2>
            )}

            {!hasSearched && (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <Filter className="text-muted-foreground mb-4 h-16 w-16" />
                    <h2 className="mb-2 text-2xl font-semibold">Find Bands</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Use the filters to search for bands by genre, location, and what they&apos;re looking for.
                    </p>
                    <Button onClick={handleSearch} size="lg">
                        Show All Bands
                    </Button>
                </div>
            )}

            {error && hasSearched && <BandSearchErrorState onRetry={handleSearch} error={error} />}

            {!error && hasSearched && results && results.results.length === 0 && <BandSearchEmptyState onClearFilters={handleClearFilters} />}

            {!error && hasSearched && results && results.results.length > 0 && <BandSearchResults results={results} onPageChange={handlePageChange} />}

            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
                    <BandSearchFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                        onSearch={() => {
                            handleSearch();
                            setIsFiltersOpen(false);
                        }}
                        onClear={handleClearFilters}
                        isLoading={false}
                        activeFilterCount={activeFilterCount}
                    />
                </SheetContent>
            </Sheet>
        </div>
    );
}
