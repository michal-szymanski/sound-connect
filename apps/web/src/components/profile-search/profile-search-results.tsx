import { Button } from '@/web/components/ui/button';
import { ProfileSearchCard } from './profile-search-card';
import type { ProfileSearchResponse } from '@sound-connect/common/types/profile-search';

type Props = {
    results: ProfileSearchResponse;
    onPageChange: (page: number) => void;
};

export function ProfileSearchResults({ results, onPageChange }: Props) {
    const { results: searchResults, pagination } = results;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {searchResults.map((result) => (
                    <ProfileSearchCard key={result.userId} result={result} />
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
