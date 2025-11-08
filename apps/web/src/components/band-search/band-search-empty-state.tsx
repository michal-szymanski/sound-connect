import { Music } from 'lucide-react';
import { Button } from '@/web/components/ui/button';

type Props = {
    onClearFilters: () => void;
};

export function BandSearchEmptyState({ onClearFilters }: Props) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <Music className="text-muted-foreground mb-4 h-16 w-16" />
            <h2 className="mb-2 text-2xl font-semibold">No Bands Found</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                We couldn&apos;t find any bands matching your search criteria. Try adjusting your filters or search in a different location.
            </p>
            <Button onClick={onClearFilters} variant="outline">
                Clear Filters
            </Button>
        </div>
    );
}
