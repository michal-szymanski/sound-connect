import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNotNull, isNull } from 'drizzle-orm';
import { userProfilesTable } from '@/drizzle/schema';
import { geocodeCity } from '../services/geocoding-service';

export async function backfillGeocodingData(db: D1Database) {
    const profilesNeedingGeocoding = await drizzle(db)
        .select()
        .from(userProfilesTable)
        .where(and(isNotNull(userProfilesTable.city), isNull(userProfilesTable.latitude)));

    console.log(`Found ${profilesNeedingGeocoding.length} profiles to geocode`);

    for (const profile of profilesNeedingGeocoding) {
        const geocoded = await geocodeCity(db, { city: profile.city! });

        if (geocoded) {
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

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('Backfill complete');
}
