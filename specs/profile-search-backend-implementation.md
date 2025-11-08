# Profile Search - Backend Implementation Guide

This document provides detailed instructions for implementing the backend portion of the Advanced Profile Search feature.

## Overview

The backend agent should implement:
1. Database migrations for geocoding_cache table and user_profiles lat/lng columns
2. Geocoding service with Nominatim API integration and caching
3. Profile search endpoint with multi-filter support
4. Database queries with bounding box pre-filtering and Haversine distance calculation
5. Backfill script to geocode existing users

## Shared Code Available

All shared code has been created in `packages/common`:

### Types (from `@sound-connect/common/types/profile-search`)
- `profileSearchParamsSchema` - Validation schema for search query parameters
- `ProfileSearchParams` - TypeScript type for search params
- `profileSearchResultSchema` - Validation schema for search results
- `ProfileSearchResult` - TypeScript type for each result
- `profileSearchResponseSchema` - Complete API response schema
- `ProfileSearchResponse` - TypeScript type for response
- `geocodingLookupParamsSchema` - Validation schema for geocoding requests
- `geocodingLookupResponseSchema` - Validation schema for geocoding responses
- `searchRadiusEnum` - Available radius values: [5, 10, 25, 50, 100]

### Utilities (from `@sound-connect/common/utils/geo`)
- `calculateBoundingBox(lat, lng, radiusMiles)` - Returns min/max lat/lng for bounding box pre-filter
- `calculateHaversineDistance(lat1, lng1, lat2, lng2)` - Returns distance in miles
- `milesToKilometers(miles)` - Convert miles to kilometers
- `kilometersToMiles(km)` - Convert kilometers to miles

### Database Schemas (from `@sound-connect/common/types/drizzle`)
- `geocodingCacheSchema` - Zod schema for geocoding_cache table
- `userProfileSchema` - Updated with latitude and longitude fields

### Database Tables (from `@sound-connect/drizzle/src/schema`)
- `geocodingCacheTable` - Schema definition with indexes
- `userProfilesTable` - Updated with latitude, longitude, and composite index

## Task 1: Database Migrations

### Migration 1: Create geocoding_cache table

**File:** `packages/drizzle/migrations/XXXX_create_geocoding_cache.sql`

```sql
-- Create geocoding_cache table
CREATE TABLE geocoding_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL,
    state TEXT,
    country TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Create composite unique index for location lookup
CREATE UNIQUE INDEX idx_geocoding_cache_location ON geocoding_cache(city, state, country);

-- Create index for TTL cleanup queries
CREATE INDEX idx_geocoding_cache_created_at ON geocoding_cache(created_at);
```

### Migration 2: Add lat/lng to user_profiles

**File:** `packages/drizzle/migrations/XXXX_add_location_to_user_profiles.sql`

```sql
-- Add latitude and longitude columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN latitude REAL;
ALTER TABLE user_profiles ADD COLUMN longitude REAL;

-- Create composite index for location-based queries
CREATE INDEX idx_user_profiles_location ON user_profiles(latitude, longitude);
```

**Steps:**
1. Run `pnpm db:generate` to generate migration files
2. Manually update Zod schemas in `packages/common/src/types/drizzle.ts` (ALREADY DONE)
3. Run `pnpm --filter @sound-connect/api db:migrate:local` to apply migrations locally

## Task 2: Geocoding Service

**File:** `apps/api/src/services/geocoding-service.ts`

### Requirements:
- Use Nominatim (OpenStreetMap) API: `https://nominatim.openstreetmap.org/search`
- Cache-first strategy (check `geocoding_cache` before API call)
- Rate limiting: Max 1 request/second to Nominatim (per their usage policy)
- Graceful fallback on API failures
- Return `null` on geocoding failure (triggers text-based fallback in search)

### Implementation Structure:

```typescript
import { geocodingCacheTable } from '@sound-connect/drizzle/src/schema';
import type { GeocodingLookupParams, GeocodingLookupResponse } from '@sound-connect/common/types/profile-search';

export async function geocodeCity(
    db: D1Database,
    params: GeocodingLookupParams
): Promise<GeocodingLookupResponse | null> {
    // 1. Check cache first
    // 2. If cache hit, return cached result
    // 3. If cache miss, call Nominatim API
    // 4. Store result in cache
    // 5. Return result
    // 6. On error, return null (fallback)
}

async function checkGeocodingCache(
    db: D1Database,
    city: string
): Promise<GeocodingLookupResponse | null> {
    // Query geocoding_cache table
    // Return cached coordinates if found
}

async function callNominatimAPI(city: string): Promise<GeocodingLookupResponse | null> {
    // Call Nominatim API
    // Parse response
    // Handle rate limiting
    // Return coordinates or null
}

async function cacheGeocodingResult(
    db: D1Database,
    result: GeocodingLookupResponse
): Promise<void> {
    // Insert into geocoding_cache table
}
```

### Nominatim API Details:

**Endpoint:** `https://nominatim.openstreetmap.org/search`

**Query Parameters:**
- `q`: City name (e.g., "Chicago, IL, USA")
- `format`: "json"
- `limit`: 1
- `addressdetails`: 1

**Headers:**
- `User-Agent`: "SoundConnect/1.0 (contact@soundconnect.app)" (REQUIRED by Nominatim)

**Rate Limit:** 1 request/second (implement delay if needed)

**Response Format:**
```json
[{
    "lat": "41.8781136",
    "lon": "-87.6297982",
    "display_name": "Chicago, Cook County, Illinois, USA",
    "address": {
        "city": "Chicago",
        "state": "Illinois",
        "country": "United States"
    }
}]
```

## Task 3: Profile Search Endpoint

**File:** `apps/api/src/routes/profiles-search.ts`

### Endpoint: `GET /api/profiles/search`

**Requirements:**
- Validate query parameters with `profileSearchParamsSchema`
- Public endpoint (no authentication required)
- Rate limiting: 100 requests per minute per IP
- Support all filters: instruments, genres, city + radius, availability status
- Pagination support (page, limit)
- Return geocoding fallback flag if geocoding failed

### Implementation Structure:

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { profileSearchParamsSchema } from '@sound-connect/common/types/profile-search';
import { searchProfiles } from '../db/queries/profiles-search-queries';
import { geocodeCity } from '../services/geocoding-service';

const app = new Hono();

app.get('/search', zValidator('query', profileSearchParamsSchema), async (c) => {
    const params = c.req.valid('query');
    const db = c.env.DB;

    // 1. If city provided, geocode it
    let geocodedLocation = null;
    let geocodingFallback = false;

    if (params.city) {
        geocodedLocation = await geocodeCity(db, { city: params.city });
        if (!geocodedLocation) {
            geocodingFallback = true;
        }
    }

    // 2. Call search query
    const results = await searchProfiles(db, params, geocodedLocation);

    // 3. Return response
    return c.json({
        results: results.data,
        pagination: results.pagination,
        geocodingFallback
    });
});

export default app;
```

### Error Handling:
- 400 Bad Request: Invalid query parameters (Zod validation handles this)
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Database or unexpected errors

## Task 4: Database Queries

**File:** `apps/api/src/db/queries/profiles-search-queries.ts`

### Main Query Function:

```typescript
import { eq, and, or, sql, isNotNull, inArray } from 'drizzle-orm';
import { userProfilesTable, userAdditionalInstrumentsTable, users } from '@sound-connect/drizzle/src/schema';
import { calculateBoundingBox, calculateHaversineDistance } from '@sound-connect/common/utils/geo';
import type { ProfileSearchParams, ProfileSearchResult, GeocodingLookupResponse } from '@sound-connect/common/types/profile-search';

export async function searchProfiles(
    db: D1Database,
    params: ProfileSearchParams,
    geocodedLocation: GeocodingLookupResponse | null
) {
    // 1. Build WHERE clause based on filters
    // 2. If location filter, add bounding box pre-filter
    // 3. Execute query with JOIN on user_additional_instruments
    // 4. Calculate Haversine distance in-app (SQLite doesn't have native geo functions)
    // 5. Filter by radius after calculating distance
    // 6. Rank: primary instrument matches before additional matches
    // 7. Sort by ranking, then by last_active_at
    // 8. Apply pagination
    // 9. Get total count for pagination metadata
    // 10. Return results + pagination
}
```

### Query Strategy:

**Bounding Box Pre-Filter:**
When location filter is applied, use bounding box to reduce dataset before Haversine calculation:

```typescript
if (geocodedLocation && params.radius) {
    const bbox = calculateBoundingBox(
        geocodedLocation.latitude,
        geocodedLocation.longitude,
        params.radius
    );

    whereConditions.push(
        and(
            sql`${userProfilesTable.latitude} >= ${bbox.minLat}`,
            sql`${userProfilesTable.latitude} <= ${bbox.maxLat}`,
            sql`${userProfilesTable.longitude} >= ${bbox.minLng}`,
            sql`${userProfilesTable.longitude} <= ${bbox.maxLng}`
        )
    );
}
```

**Post-Query Distance Filtering:**
After fetching results, calculate precise distance and filter:

```typescript
const filteredResults = results
    .map(row => {
        const distance = geocodedLocation && row.latitude && row.longitude
            ? calculateHaversineDistance(
                geocodedLocation.latitude,
                geocodedLocation.longitude,
                row.latitude,
                row.longitude
            )
            : null;

        return { ...row, distance };
    })
    .filter(row => {
        if (!params.radius || !geocodedLocation) return true;
        return row.distance !== null && row.distance <= params.radius;
    });
```

**Instrument Ranking:**
Primary instrument matches should rank higher than additional instrument matches:

```typescript
.select({
    // ... other fields
    matchedInstrumentType: sql<'primary' | 'additional'>`
        CASE
            WHEN ${userProfilesTable.primaryInstrument} IN (${params.instruments})
            THEN 'primary'
            ELSE 'additional'
        END
    `.as('matched_instrument_type')
})
.orderBy(
    sql`CASE WHEN matched_instrument_type = 'primary' THEN 0 ELSE 1 END`,
    desc(users.lastActiveAt)
);
```

**Genre Matching:**
Secondary genres are stored as comma-separated text, so use LIKE for matching:

```typescript
if (params.genres && params.genres.length > 0) {
    const genreConditions = params.genres.map(genre =>
        or(
            eq(userProfilesTable.primaryGenre, genre),
            sql`${userProfilesTable.secondaryGenres} LIKE ${'%' + genre + '%'}`
        )
    );
    whereConditions.push(or(...genreConditions));
}
```

### Performance Considerations:
- Use indexes: `idx_user_profiles_location`, `idx_user_profiles_status`, `idx_user_profiles_primary_genre`, `idx_user_additional_instruments_instrument`
- Bounding box reduces dataset before expensive Haversine calculations
- Pagination prevents large result sets
- Query timeout: 5 seconds

## Task 5: Update Profile Handler

When a user updates their profile city, geocode and store lat/lng.

**File:** Update the profile update handler (wherever profile updates are processed)

```typescript
import { geocodeCity } from '../services/geocoding-service';

// When profile is updated with new city
if (updatedFields.city) {
    const geocoded = await geocodeCity(db, { city: updatedFields.city });

    if (geocoded) {
        updatedFields.latitude = geocoded.latitude;
        updatedFields.longitude = geocoded.longitude;
    } else {
        // Geocoding failed, clear lat/lng
        updatedFields.latitude = null;
        updatedFields.longitude = null;
    }
}
```

## Task 6: Backfill Script

Create a script to geocode existing users who have a city but no lat/lng.

**File:** `apps/api/src/scripts/backfill-geocoding.ts`

```typescript
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';
import { userProfilesTable } from '@sound-connect/drizzle/src/schema';
import { geocodeCity } from '../services/geocoding-service';

export async function backfillGeocodingData(db: D1Database) {
    // 1. Query all profiles with city but no lat/lng
    const profilesNeedingGeocoding = await drizzle(db)
        .select()
        .from(userProfilesTable)
        .where(
            and(
                isNotNull(userProfilesTable.city),
                isNull(userProfilesTable.latitude)
            )
        );

    console.log(`Found ${profilesNeedingGeocoding.length} profiles to geocode`);

    // 2. Geocode each profile (with rate limiting)
    for (const profile of profilesNeedingGeocoding) {
        const geocoded = await geocodeCity(db, { city: profile.city! });

        if (geocoded) {
            // 3. Update profile with lat/lng
            await drizzle(db)
                .update(userProfilesTable)
                .set({
                    latitude: geocoded.latitude,
                    longitude: geocoded.longitude,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(userProfilesTable.id, profile.id));

            console.log(`Geocoded: ${profile.city} -> ${geocoded.latitude}, ${geocoded.longitude}`);
        } else {
            console.log(`Failed to geocode: ${profile.city}`);
        }

        // 4. Rate limit: Wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Backfill complete');
}
```

**Usage:**
This script should be documented but NOT executed automatically. It should be run manually or via a one-time command after deployment.

## Testing

### Unit Tests
- Test geocoding service (cache hit, cache miss, API failure)
- Test search query logic (each filter type)
- Test bounding box calculation
- Test Haversine distance calculation

### Integration Tests
- Test search endpoint with various filter combinations
- Test geocoding fallback behavior
- Test pagination
- Test rate limiting

### Performance Tests
- Query speed should be < 500ms
- Test with large datasets (1000+ profiles)
- Verify bounding box optimization works

## Checklist

- [ ] Create geocoding_cache migration
- [ ] Create user_profiles lat/lng migration
- [ ] Run `pnpm db:generate`
- [ ] Apply migrations locally: `pnpm --filter @sound-connect/api db:migrate:local`
- [ ] Implement geocoding service with Nominatim integration
- [ ] Implement cache-first lookup strategy
- [ ] Implement profile search endpoint
- [ ] Implement database queries with bounding box pre-filter
- [ ] Implement Haversine distance calculation
- [ ] Implement instrument ranking (primary > additional)
- [ ] Update profile handler to geocode on city changes
- [ ] Create backfill script (documented, not executed)
- [ ] Add rate limiting to search endpoint (100 req/min per IP)
- [ ] Add rate limiting to Nominatim calls (1 req/sec)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Invoke code-quality-enforcer before marking complete
- [ ] Verify all code passes Prettier, ESLint, TypeScript checks

## Notes

- The backend should NOT expose email addresses in search results (use userDTOSchema which omits email)
- Geocoding failures should be graceful (return null, trigger text-based fallback)
- All validation uses Zod schemas from `packages/common`
- Database queries use Drizzle ORM (parameterized queries prevent SQL injection)
- Rate limiting is critical for both search endpoint and Nominatim API
