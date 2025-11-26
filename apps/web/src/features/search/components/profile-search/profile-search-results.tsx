import { Button } from '@/shared/components/ui/button';
import { BlurFade } from '@/shared/components/ui/blur-fade';
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
            <div className="space-y-4">
                {searchResults.map((result, index) => (
                    <BlurFade key={result.userId} delay={0.1 + index * 0.05} inView>
                        <ProfileSearchCard result={result} />
                    </BlurFade>
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
