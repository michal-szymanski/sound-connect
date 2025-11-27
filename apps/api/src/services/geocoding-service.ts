import type { LocationSuggestion } from '@sound-connect/common/types/location';
import { GeocodingCore } from '@mapbox/search-js-core';

export async function autocompleteLocation(query: string, accessToken: string): Promise<LocationSuggestion[]> {
    try {
        const geocode = new GeocodingCore({ accessToken });

        const response = await geocode.suggest(query, {
            types: 'place',
            limit: 5
        });

        if (!response.features || response.features.length === 0) {
            return [];
        }

        const suggestions: LocationSuggestion[] = response.features
            .map((feature) => {
                const longitude = feature.geometry.coordinates[0];
                const latitude = feature.geometry.coordinates[1];

                const placeContext = feature.properties.context.place;
                const regionContext = feature.properties.context.region;
                const countryContext = feature.properties.context.country;

                const city = placeContext?.name || feature.properties.name;
                const state = regionContext?.name || null;
                const country = countryContext?.name || '';

                return {
                    mapboxId: feature.properties.mapbox_id,
                    displayName: feature.properties.full_address,
                    city,
                    state,
                    country,
                    latitude,
                    longitude
                };
            })
            .filter((s): s is LocationSuggestion => s !== null);

        return suggestions;
    } catch (error) {
        console.error('[Mapbox] Exception:', error);
        return [];
    }
}
