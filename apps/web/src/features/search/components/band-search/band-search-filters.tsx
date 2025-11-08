import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { GenreEnum } from '@sound-connect/common/types/profile-enums';
import { searchRadiusEnum } from '@sound-connect/common/types/band-search';
import type { BandSearchParams } from '@sound-connect/common/types/band-search';

type Props = {
    filters: BandSearchParams;
    onFiltersChange: (filters: BandSearchParams) => void;
    onSearch: () => void;
    onClear: () => void;
    isLoading: boolean;
    activeFilterCount?: number;
};

export function BandSearchFilters({ filters, onFiltersChange, onSearch, onClear, isLoading, activeFilterCount }: Props) {
    const formatLabel = (value: string) => {
        return value
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filter Bands</h2>
                {activeFilterCount !== undefined && activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount} active</Badge>}
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Select
                        value={filters.genre || ''}
                        onValueChange={(value) => {
                            onFiltersChange({ ...filters, genre: value ? (value as (typeof GenreEnum)[number]) : undefined });
                        }}
                    >
                        <SelectTrigger id="genre" className="mt-2">
                            <SelectValue placeholder="Select genre..." />
                        </SelectTrigger>
                        <SelectContent>
                            {GenreEnum.map((genre) => (
                                <SelectItem key={genre} value={genre}>
                                    {formatLabel(genre)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="city">Location</Label>
                    <Input
                        id="city"
                        placeholder="City (e.g., Chicago, IL)"
                        value={filters.city || ''}
                        onChange={(e) => onFiltersChange({ ...filters, city: e.target.value || undefined })}
                        className="mt-2"
                    />
                </div>

                <div>
                    <Label htmlFor="radius">Radius</Label>
                    <Select
                        value={filters.radius?.toString() || ''}
                        onValueChange={(value) => {
                            const numValue = value ? Number(value) : undefined;
                            onFiltersChange({ ...filters, radius: numValue as 5 | 10 | 25 | 50 | 100 | undefined });
                        }}
                        disabled={!filters.city}
                    >
                        <SelectTrigger id="radius" className="mt-2">
                            <SelectValue placeholder="Select radius..." />
                        </SelectTrigger>
                        <SelectContent>
                            {searchRadiusEnum.map((radius: number) => (
                                <SelectItem key={radius} value={radius.toString()}>
                                    {radius} miles
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="lookingFor">Looking For</Label>
                    <Input
                        id="lookingFor"
                        placeholder="e.g., guitarist, drummer, vocalist"
                        value={filters.lookingFor || ''}
                        onChange={(e) => onFiltersChange({ ...filters, lookingFor: e.target.value || undefined })}
                        className="mt-2"
                    />
                </div>

                <div className="flex flex-col gap-2 pt-4">
                    <Button onClick={onSearch} disabled={isLoading} className="w-full" data-testid="search-bands-button">
                        {isLoading ? 'Searching...' : 'Search Bands'}
                    </Button>
                    <Button onClick={onClear} variant="secondary" disabled={isLoading} className="w-full">
                        Clear Filters
                    </Button>
                </div>
            </div>
        </div>
    );
}
