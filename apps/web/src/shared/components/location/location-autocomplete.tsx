import { useState, useRef } from 'react';
import { MapPin, X, Loader2, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useLocationAutocomplete } from '@/shared/hooks/use-location-autocomplete';
import type { SelectedLocation, LocationSuggestion } from '@sound-connect/common/types/location';

type Props = {
    value: SelectedLocation | null;
    onChange: (location: SelectedLocation | null) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    error?: string;
    id?: string;
};

export function LocationAutocomplete({ value, onChange, placeholder = 'Search for a city...', disabled, required, error, id }: Props) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: suggestions = [], isLoading, isError } = useLocationAutocomplete(searchQuery, { enabled: open && searchQuery.length >= 2 });

    const displayValue = value ? `${value.city}${value.state ? `, ${value.state}` : ''}, ${value.country}` : '';

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            setSearchQuery('');
        }
    };

    const handleSelect = (suggestion: LocationSuggestion) => {
        const selectedLocation: SelectedLocation = {
            city: suggestion.city,
            state: suggestion.state || undefined,
            country: suggestion.country,
            latitude: suggestion.latitude,
            longitude: suggestion.longitude
        };
        onChange(selectedLocation);
        setOpen(false);
        setSearchQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        setSearchQuery('');
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-required={required}
                    aria-invalid={!!error}
                    disabled={disabled}
                    className={cn(
                        'h-9 w-full justify-between font-normal',
                        !value && 'text-muted-foreground',
                        error && 'border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40'
                    )}
                >
                    <span className="flex items-center gap-2 truncate">
                        <MapPin className="h-4 w-4 shrink-0 opacity-50" />
                        <span className="truncate">{displayValue || placeholder}</span>
                    </span>
                    {value ? (
                        <X className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100" onClick={handleClear} aria-label="Clear location" />
                    ) : (
                        <Search className="h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="z-popover w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput ref={inputRef} placeholder={placeholder} value={searchQuery} onValueChange={setSearchQuery} autoFocus />
                    <CommandList>
                        {isLoading && searchQuery.length >= 2 && (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                                <span className="sr-only">Loading location suggestions</span>
                            </div>
                        )}
                        {!isLoading && searchQuery.length < 2 && <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>}
                        {!isLoading && searchQuery.length >= 2 && suggestions.length === 0 && !isError && <CommandEmpty>No locations found.</CommandEmpty>}
                        {isError && <CommandEmpty>Failed to load suggestions. Please try again.</CommandEmpty>}
                        {!isLoading && suggestions.length > 0 && (
                            <CommandGroup>
                                {suggestions.map((suggestion) => (
                                    <CommandItem
                                        key={suggestion.mapboxId}
                                        value={suggestion.mapboxId}
                                        onSelect={() => handleSelect(suggestion)}
                                        className="cursor-pointer"
                                    >
                                        <MapPin className="mr-2 h-4 w-4 opacity-50" aria-hidden="true" />
                                        <span>{suggestion.displayName}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
