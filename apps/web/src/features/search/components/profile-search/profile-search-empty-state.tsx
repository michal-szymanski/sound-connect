import { Search } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

type Props = {
    onClearFilters: () => void;
};

export function ProfileSearchEmptyState({ onClearFilters }: Props) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <Search className="text-muted-foreground mb-4 h-16 w-16" />
            <h2 className="mb-2 text-2xl font-semibold">No musicians match your filters</h2>
            <p className="text-muted-foreground mb-6 max-w-md">Try broadening your search criteria or removing some filters to see more results.</p>
            <Button onClick={onClearFilters}>Clear All Filters</Button>
        </div>
    );
}
