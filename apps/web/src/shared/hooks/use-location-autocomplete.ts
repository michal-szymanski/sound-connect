import { useQuery } from '@tanstack/react-query';
import { useDebounce } from './use-debounce';
import { autocompleteLocation } from '@/shared/server-functions/geocoding';
import type { LocationSuggestion } from '@sound-connect/common/types/location';

type UseLocationAutocompleteOptions = {
    enabled?: boolean;
};

export function useLocationAutocomplete(query: string, options?: UseLocationAutocompleteOptions) {
    const debouncedQuery = useDebounce(query, 300);

    return useQuery<LocationSuggestion[]>({
        queryKey: ['location-autocomplete', debouncedQuery],
        queryFn: async () => {
            const result = await autocompleteLocation({ data: { query: debouncedQuery } });
            if (!result.success) {
                throw new Error(result.body?.message || 'Failed to fetch location suggestions');
            }
            return result.body.suggestions;
        },
        enabled: debouncedQuery.length >= 2 && options?.enabled !== false,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000
    });
}
