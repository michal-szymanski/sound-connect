import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { geocodingCacheTable } from '@/drizzle/schema';
import type { GeocodingLookupParams, GeocodingLookupResponse } from '@sound-connect/common/types/profile-search';
import type { LocationSuggestion } from '@sound-connect/common/types/location';
import { GeocodingCore } from '@mapbox/search-js-core';

type NominatimResponse = {
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        city?: string;
        state?: string;
        country?: string;
    };
};

export async function geocodeCity(db: D1Database, params: GeocodingLookupParams): Promise<GeocodingLookupResponse | null> {
    try {
        const cached = await checkGeocodingCache(db, params.city);
        if (cached) {
            return cached;
        }

        const result = await callNominatimAPI(params.city);
        if (result) {
            await cacheGeocodingResult(db, result);
        }

        return result;
    } catch {
        return null;
    }
}

async function checkGeocodingCache(db: D1Database, city: string): Promise<GeocodingLookupResponse | null> {
    const normalizedCity = city.trim().toLowerCase();

    const results = await drizzle(db).select().from(geocodingCacheTable).where(eq(geocodingCacheTable.city, normalizedCity)).limit(1);

    if (results.length === 0 || !results[0]) {
        return null;
    }

    const cached = results[0];

    return {
        city: cached.city,
        state: cached.state ?? null,
        country: cached.country ?? null,
        latitude: cached.latitude,
        longitude: cached.longitude,
        cached: true
    };
}

async function callNominatimAPI(city: string): Promise<GeocodingLookupResponse | null> {
    try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', city);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '1');
        url.searchParams.set('addressdetails', '1');

        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'SoundConnect/1.0 (contact@soundconnect.app)'
            }
        });

        if (!response.ok) {
            return null;
        }

        const data: NominatimResponse[] = await response.json();

        if (data.length === 0 || !data[0]) {
            return null;
        }

        const result = data[0];
        const normalizedCity = city.trim().toLowerCase();

        return {
            city: normalizedCity,
            state: result.address?.state ?? null,
            country: result.address?.country ?? null,
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            cached: false
        };
    } catch {
        return null;
    }
}

async function cacheGeocodingResult(db: D1Database, result: GeocodingLookupResponse): Promise<void> {
    const now = new Date().toISOString();

    try {
        await drizzle(db)
            .insert(geocodingCacheTable)
            .values({
                city: result.city,
                state: result.state ?? null,
                country: result.country ?? null,
                latitude: result.latitude,
                longitude: result.longitude,
                createdAt: now,
                updatedAt: now
            });
    } catch {
        return;
    }
}

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

        const suggestions: LocationSuggestion[] = response.features.map((feature) => {
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
        }).filter((s): s is LocationSuggestion => s !== null);

        return suggestions;
    } catch (error) {
        console.error('[Mapbox] Exception:', error);
        return [];
    }
}
