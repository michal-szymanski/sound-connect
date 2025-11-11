import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, sql, isNotNull, inArray, desc } from 'drizzle-orm';
import { userProfilesTable, userAdditionalInstrumentsTable, users, userSettingsTable, blockedUsersTable } from '@/drizzle/schema';
import { calculateBoundingBox, calculateHaversineDistance } from '@sound-connect/common/utils/geo';
import type { ProfileSearchParams, GeocodingLookupResponse } from '@sound-connect/common/types/profile-search';

export async function searchProfiles(db: D1Database, params: ProfileSearchParams, geocodedLocation: GeocodingLookupResponse | null, requesterId?: string) {
    const whereConditions = [eq(userProfilesTable.setupCompleted, true)];

    if (requesterId) {
        const blockedByRequester = await drizzle(db)
            .select({ blockedId: blockedUsersTable.blockedId })
            .from(blockedUsersTable)
            .where(eq(blockedUsersTable.blockerId, requesterId));

        const blockedRequester = await drizzle(db)
            .select({ blockerId: blockedUsersTable.blockerId })
            .from(blockedUsersTable)
            .where(eq(blockedUsersTable.blockedId, requesterId));

        const blockedUserIds = [...blockedByRequester.map((b) => b.blockedId), ...blockedRequester.map((b) => b.blockerId)];

        if (blockedUserIds.length > 0) {
            whereConditions.push(
                sql`${users.id} NOT IN (${sql.join(
                    blockedUserIds.map((id) => sql`${id}`),
                    sql`, `
                )})`
            );
        }
    }

    if (params.instruments && params.instruments.length > 0) {
        const instrumentConditions = or(
            inArray(userProfilesTable.primaryInstrument, params.instruments),
            sql`EXISTS (
                SELECT 1 FROM ${userAdditionalInstrumentsTable}
                WHERE ${userAdditionalInstrumentsTable.userId} = ${users.id}
                AND ${inArray(userAdditionalInstrumentsTable.instrument, params.instruments)}
            )`
        );
        if (instrumentConditions) {
            whereConditions.push(instrumentConditions);
        }
    }

    if (params.genres && params.genres.length > 0) {
        const genreConditions = params.genres.map((genre) =>
            or(eq(userProfilesTable.primaryGenre, genre), sql`${userProfilesTable.secondaryGenres} LIKE ${'%' + genre + '%'}`)
        );
        const combined = or(...genreConditions);
        if (combined) {
            whereConditions.push(combined);
        }
    }

    if (params.availabilityStatus && params.availabilityStatus.length > 0) {
        whereConditions.push(inArray(userProfilesTable.status, params.availabilityStatus));
    }

    if (geocodedLocation && params.radius) {
        const bbox = calculateBoundingBox(geocodedLocation.latitude, geocodedLocation.longitude, params.radius);

        const bboxCondition = and(
            isNotNull(userProfilesTable.latitude),
            isNotNull(userProfilesTable.longitude),
            sql`${userProfilesTable.latitude} >= ${bbox.minLat}`,
            sql`${userProfilesTable.latitude} <= ${bbox.maxLat}`,
            sql`${userProfilesTable.longitude} >= ${bbox.minLng}`,
            sql`${userProfilesTable.longitude} <= ${bbox.maxLng}`
        );
        if (bboxCondition) {
            whereConditions.push(bboxCondition);
        }
    } else if (params.city) {
        whereConditions.push(eq(userProfilesTable.city, params.city.trim().toLowerCase()));
    }

    const matchedInstrumentType =
        params.instruments && params.instruments.length > 0
            ? sql<'primary' | 'additional'>`
            CASE
                WHEN ${inArray(userProfilesTable.primaryInstrument, params.instruments)}
                THEN 'primary'
                ELSE 'additional'
            END
        `.as('matched_instrument_type')
            : sql<'primary' | 'additional'>`'primary'`.as('matched_instrument_type');

    const results = await drizzle(db)
        .select({
            userId: users.id,
            name: users.name,
            image: users.image,
            primaryInstrument: userProfilesTable.primaryInstrument,
            yearsPlayingPrimary: userProfilesTable.yearsPlayingPrimary,
            primaryGenre: userProfilesTable.primaryGenre,
            secondaryGenres: userProfilesTable.secondaryGenres,
            status: userProfilesTable.status,
            city: userProfilesTable.city,
            state: userProfilesTable.state,
            country: userProfilesTable.country,
            profileCompletion: userProfilesTable.profileCompletion,
            latitude: userProfilesTable.latitude,
            longitude: userProfilesTable.longitude,
            matchedInstrumentType,
            searchVisibility: userSettingsTable.searchVisibility
        })
        .from(users)
        .innerJoin(userProfilesTable, eq(userProfilesTable.userId, users.id))
        .leftJoin(userSettingsTable, eq(userSettingsTable.userId, users.id))
        .where(and(...whereConditions))
        .orderBy(
            params.instruments && params.instruments.length > 0 ? sql`CASE WHEN ${matchedInstrumentType} = 'primary' THEN 0 ELSE 1 END` : sql`1`,
            desc(users.lastActiveAt)
        );

    let filteredResults = results
        .filter((row) => row.searchVisibility === null || row.searchVisibility === true)
        .map((row) => {
            const distance =
                geocodedLocation && row.latitude !== null && row.longitude !== null
                    ? calculateHaversineDistance(geocodedLocation.latitude, geocodedLocation.longitude, row.latitude, row.longitude)
                    : null;

            return {
                ...row,
                distance
            };
        });

    if (params.radius && geocodedLocation) {
        filteredResults = filteredResults.filter((row) => row.distance !== null && row.distance <= params.radius!);
    }

    const total = filteredResults.length;

    const offset = (params.page - 1) * params.limit;
    const paginatedResults = filteredResults.slice(offset, offset + params.limit);

    const totalPages = Math.ceil(total / params.limit);
    const hasMore = params.page < totalPages;

    return {
        data: paginatedResults.map((row) => ({
            userId: row.userId,
            name: row.name,
            image: row.image,
            primaryInstrument: row.primaryInstrument,
            yearsPlayingPrimary: row.yearsPlayingPrimary,
            primaryGenre: row.primaryGenre,
            secondaryGenres: row.secondaryGenres,
            status: row.status,
            city: row.city,
            state: row.state,
            country: row.country,
            profileCompletion: row.profileCompletion,
            distance: row.distance,
            matchedInstrumentType: row.matchedInstrumentType
        })),
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages,
            hasMore
        }
    };
}
