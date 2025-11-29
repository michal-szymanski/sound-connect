import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Filter } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Sheet, SheetContent } from '@/shared/components/ui/sheet';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { WordRotate } from '@/shared/components/ui/word-rotate';
import { ProfileSearchFilters } from '@/features/search/components/profile-search/profile-search-filters';
import { ProfileSearchResults } from '@/features/search/components/profile-search/profile-search-results';
import { ProfileSearchEmptyState } from '@/features/search/components/profile-search/profile-search-empty-state';
import { ProfileSearchErrorState } from '@/features/search/components/profile-search/profile-search-error-state';
import { searchProfiles } from '@/features/search/server-functions/profile-search';
import { InstrumentEnum, GenreEnum, AvailabilityStatusEnum } from '@sound-connect/common/types/profile-enums';
import type { ProfileSearchParams, ProfileSearchResponse } from '@sound-connect/common/types/profile-search';

const searchParamsSchema = z.object({
    city: z.string().optional(),
    instruments: z
        .union([z.enum(InstrumentEnum), z.array(z.enum(InstrumentEnum))])
        .transform((val) => (Array.isArray(val) ? val : [val]))
        .optional(),
    genres: z
        .union([z.enum(GenreEnum), z.array(z.enum(GenreEnum))])
        .transform((val) => (Array.isArray(val) ? val : [val]))
        .optional(),
    availabilityStatus: z
        .union([z.enum(AvailabilityStatusEnum), z.array(z.enum(AvailabilityStatusEnum))])
        .transform((val) => (Array.isArray(val) ? val : [val]))
        .optional(),
    radius: z.coerce.number().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(12),
    showAll: z.boolean().optional()
});

type LoaderResult = { type: 'success'; data: ProfileSearchResponse } | { type: 'no-search' } | { type: 'error'; message: string };

export const Route = createFileRoute('/(main)/musicians')({
    component: MusiciansPage,
    validateSearch: searchParamsSchema,
    loaderDeps: ({ search }) => ({
        city: search.city,
        instruments: search.instruments,
        genres: search.genres,
        availabilityStatus: search.availabilityStatus,
        radius: search.radius,
        page: search.page,
        limit: search.limit,
        showAll: search.showAll
    }),
    loader: async ({ deps }): Promise<LoaderResult> => {
        const hasFilters = deps.city || deps.instruments?.length || deps.genres?.length || deps.availabilityStatus?.length;

        if (!hasFilters && !deps.showAll) {
            return { type: 'no-search' };
        }

        try {
            const result = await searchProfiles({
                data: {
                    page: deps.page,
                    limit: deps.limit,
                    city: deps.city,
                    instruments: deps.instruments,
                    genres: deps.genres,
                    availabilityStatus: deps.availabilityStatus,
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

function MusiciansPage() {
    const searchParams = Route.useSearch();
    const loaderData = Route.useLoaderData();
    const navigate = useNavigate();

    const [filters, setFilters] = useState<ProfileSearchParams>({
        page: searchParams.page || 1,
        limit: 12,
        city: searchParams.city,
        instruments: searchParams.instruments as ProfileSearchParams['instruments'],
        genres: searchParams.genres as ProfileSearchParams['genres'],
        availabilityStatus: searchParams.availabilityStatus as ProfileSearchParams['availabilityStatus'],
        radius: searchParams.radius
    });
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [filterSlot] = useState<HTMLElement | null>(() => {
        if (typeof document !== 'undefined') {
            return document.getElementById('musicians-filters-slot');
        }
        return null;
    });

    const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

    const results = loaderData.type === 'success' ? loaderData.data : null;
    const error = loaderData.type === 'error' ? loaderData.message : null;
    const hasSearched = loaderData.type !== 'no-search';

    const handleSearch = useCallback(() => {
        window.scrollTo(0, 0);

        navigate({
            to: '/musicians',
            search: {
                city: filters.city,
                instruments: filters.instruments,
                genres: filters.genres,
                availabilityStatus: filters.availabilityStatus,
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
            to: '/musicians',
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
            to: '/musicians',
            search: {
                ...filters,
                page,
                limit: 12
            },
            replace: true
        });
    };

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
                    {results.pagination.total} {results.pagination.total === 1 ? 'musician' : 'musicians'} found
                </h2>
            )}

            {!hasSearched && (
                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                    <Filter className="text-muted-foreground mb-4 h-16 w-16" />
                    <h2 className="mb-2 text-2xl font-semibold">
                        Find your next{' '}
                        <WordRotate
                            words={['drummer', 'guitarist', 'vocalist', 'bandmate']}
                            duration={3000}
                            className="text-primary inline-block"
                            loop={false}
                        />
                    </h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Use the filters to search for musicians by instrument, location, genre, and availability status.
                    </p>
                    <Button onClick={handleSearch} size="lg">
                        Show All Musicians
                    </Button>
                </div>
            )}

            {error && hasSearched && <ProfileSearchErrorState onRetry={handleSearch} error={error} />}

            {!error && hasSearched && results && results.results.length === 0 && <ProfileSearchEmptyState onClearFilters={handleClearFilters} />}

            {!error && hasSearched && results && results.results.length > 0 && <ProfileSearchResults results={results} onPageChange={handlePageChange} />}

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
                        isLoading={false}
                        activeFilterCount={activeFilterCount}
                    />
                </SheetContent>
            </Sheet>
        </div>
    );
}
