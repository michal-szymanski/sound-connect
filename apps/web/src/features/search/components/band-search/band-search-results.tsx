import { Button } from '@/shared/components/ui/button';
import { BandSearchCard } from './band-search-card';
import type { BandSearchResponse, BandSearchResult } from '@sound-connect/common/types/band-search';

type Props = {
    results: BandSearchResponse;
    onPageChange: (page: number) => void;
};

export function BandSearchResults({ results, onPageChange }: Props) {
    const { results: searchResults, pagination } = results;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {searchResults.map((result: BandSearchResult) => (
                    <BandSearchCard key={result.id} result={result} />
                ))}
            </div>

            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                        Previous
                    </Button>
                    <span className="text-muted-foreground text-sm">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button variant="outline" onClick={() => onPageChange(pagination.page + 1)} disabled={!pagination.hasMore}>
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
