import { useState } from 'react';
import { Check, ChevronsUpDown, X, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/shared/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Badge } from '@/shared/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { cn } from '@/shared/lib/utils';
import { AvailabilityStatusEnum, type Instrument, type Genre, type AvailabilityStatus } from '@sound-connect/common/types/profile-enums';
import { searchRadiusEnum } from '@sound-connect/common/types/profile-search';
import { availabilityStatusConfig } from '@/shared/lib/utils/availability';
import type { ProfileSearchParams } from '@sound-connect/common/types/profile-search';
import { LocationAutocomplete } from '@/shared/components/location/location-autocomplete';
import type { SelectedLocation } from '@sound-connect/common/types/location';
import { formatInstrument, formatGenre, getSortedGenres, getSortedInstruments } from '@/features/profile/lib/profile-utils';

type Props = {
    filters: ProfileSearchParams;
    onFiltersChange: (filters: ProfileSearchParams) => void;
    onSearch: () => void;
    onClear: () => void;
    isLoading: boolean;
    activeFilterCount?: number;
};

export function ProfileSearchFilters({ filters, onFiltersChange, onSearch, onClear, isLoading, activeFilterCount }: Props) {
    const [instrumentsOpen, setInstrumentsOpen] = useState(false);
    const [genresOpen, setGenresOpen] = useState(false);
    const [availabilityOpen, setAvailabilityOpen] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(
        filters.city ? { city: filters.city, state: undefined, country: '', latitude: filters.latitude || 0, longitude: filters.longitude || 0 } : null
    );

    const selectedInstruments = filters.instruments || [];
    const selectedGenres = filters.genres || [];
    const selectedStatuses = filters.availabilityStatus || [];

    const handleInstrumentToggle = (instrument: Instrument) => {
        const newInstruments = selectedInstruments.includes(instrument)
            ? selectedInstruments.filter((i) => i !== instrument)
            : [...selectedInstruments, instrument];
        onFiltersChange({ ...filters, instruments: newInstruments.length > 0 ? newInstruments : undefined });
    };

    const handleInstrumentRemove = (instrument: Instrument) => {
        const newInstruments = selectedInstruments.filter((i) => i !== instrument);
        onFiltersChange({ ...filters, instruments: newInstruments.length > 0 ? newInstruments : undefined });
    };

    const handleGenreToggle = (genre: Genre) => {
        const newGenres = selectedGenres.includes(genre) ? selectedGenres.filter((g) => g !== genre) : [...selectedGenres, genre];
        onFiltersChange({ ...filters, genres: newGenres.length > 0 ? newGenres : undefined });
    };

    const handleGenreRemove = (genre: Genre) => {
        const newGenres = selectedGenres.filter((g) => g !== genre);
        onFiltersChange({ ...filters, genres: newGenres.length > 0 ? newGenres : undefined });
    };

    const handleStatusToggle = (status: AvailabilityStatus) => {
        const newStatuses = selectedStatuses.includes(status) ? selectedStatuses.filter((s) => s !== status) : [...selectedStatuses, status];
        onFiltersChange({ ...filters, availabilityStatus: newStatuses.length > 0 ? newStatuses : undefined });
    };

    const handleLocationChange = (location: SelectedLocation | null) => {
        setSelectedLocation(location);
        if (location) {
            onFiltersChange({
                ...filters,
                city: location.city,
                latitude: location.latitude,
                longitude: location.longitude
            });
        } else {
            onFiltersChange({
                ...filters,
                city: undefined,
                latitude: undefined,
                longitude: undefined,
                radius: undefined
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filter Musicians</h2>
                {activeFilterCount !== undefined && activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount} active</Badge>}
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="instruments">Instruments</Label>
                    <Popover open={instrumentsOpen} onOpenChange={setInstrumentsOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={instrumentsOpen} className="mt-2 w-full justify-between" id="instruments">
                                {selectedInstruments.length > 0 ? `${selectedInstruments.length} selected` : 'Select instruments...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search instruments..." />
                                <CommandEmpty>No instrument found.</CommandEmpty>
                                <CommandGroup>
                                    <ScrollArea className="h-48">
                                        {getSortedInstruments().map((instrument) => (
                                            <CommandItem
                                                key={instrument}
                                                onSelect={() => {
                                                    handleInstrumentToggle(instrument);
                                                }}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', selectedInstruments.includes(instrument) ? 'opacity-100' : 'opacity-0')} />
                                                {formatInstrument(instrument)}
                                            </CommandItem>
                                        ))}
                                    </ScrollArea>
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {selectedInstruments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {selectedInstruments.map((instrument) => (
                                <Badge key={instrument} variant="secondary" className="gap-1">
                                    {formatInstrument(instrument)}
                                    <button
                                        onClick={() => handleInstrumentRemove(instrument)}
                                        className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                                        aria-label={`Remove ${formatInstrument(instrument)}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <Label htmlFor="location">Location</Label>
                    <LocationAutocomplete id="location" value={selectedLocation} onChange={handleLocationChange} placeholder="Search for a city..." />
                </div>

                <div>
                    <Label htmlFor="radius">Radius</Label>
                    <Select
                        value={filters.radius?.toString() || ''}
                        onValueChange={(value) => {
                            const numValue = value ? Number(value) : undefined;
                            onFiltersChange({ ...filters, radius: numValue as 5 | 10 | 25 | 50 | 100 | undefined });
                        }}
                        disabled={!selectedLocation}
                    >
                        <SelectTrigger id="radius" className="mt-2">
                            <SelectValue placeholder="Select radius..." />
                        </SelectTrigger>
                        <SelectContent>
                            {searchRadiusEnum.map((radius) => (
                                <SelectItem key={radius} value={radius.toString()}>
                                    {radius} miles
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="genres">Genres</Label>
                    <Popover open={genresOpen} onOpenChange={setGenresOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={genresOpen} className="mt-2 w-full justify-between" id="genres">
                                {selectedGenres.length > 0 ? `${selectedGenres.length} selected` : 'Select genres...'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Search genres..." />
                                <CommandEmpty>No genre found.</CommandEmpty>
                                <CommandGroup>
                                    <ScrollArea className="h-48">
                                        {getSortedGenres().map((genre) => (
                                            <CommandItem
                                                key={genre}
                                                onSelect={() => {
                                                    handleGenreToggle(genre);
                                                }}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', selectedGenres.includes(genre) ? 'opacity-100' : 'opacity-0')} />
                                                {formatGenre(genre)}
                                            </CommandItem>
                                        ))}
                                    </ScrollArea>
                                </CommandGroup>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {selectedGenres.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {selectedGenres.map((genre) => (
                                <Badge key={genre} variant="secondary" className="gap-1">
                                    {formatGenre(genre)}
                                    <button
                                        onClick={() => handleGenreRemove(genre)}
                                        className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                                        aria-label={`Remove ${formatGenre(genre)}`}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                <Collapsible open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
                    <CollapsibleTrigger className="hover:bg-accent -ml-1 flex w-full items-center justify-between rounded-sm px-1 py-0.5">
                        <Label className="cursor-pointer">Availability Status</Label>
                        <ChevronDown className={cn('h-4 w-4 transition-transform', availabilityOpen && 'rotate-180')} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="mt-2 space-y-2">
                            {AvailabilityStatusEnum.map((status) => {
                                const config = availabilityStatusConfig[status];
                                return (
                                    <div key={status} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`status-${status}`}
                                            checked={selectedStatuses.includes(status)}
                                            onCheckedChange={() => handleStatusToggle(status)}
                                        />
                                        <label
                                            htmlFor={`status-${status}`}
                                            className="flex cursor-pointer items-center gap-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            <span className={cn('h-2 w-2 rounded-full', config.dot)} />
                                            {config.label}
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                <div className="flex flex-col gap-2 pt-4">
                    <Button onClick={onSearch} disabled={isLoading} className="w-full" data-testid="search-musicians-button">
                        {isLoading ? 'Searching...' : 'Search Musicians'}
                    </Button>
                    <Button onClick={onClear} variant="secondary" disabled={isLoading} className="w-full">
                        Clear Filters
                    </Button>
                </div>
            </div>
        </div>
    );
}
