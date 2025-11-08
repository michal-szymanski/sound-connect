import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql, isNotNull, desc } from 'drizzle-orm';
import { bandsTable, bandsMembersTable } from '@/drizzle/schema';
import { calculateBoundingBox, calculateHaversineDistance } from '@sound-connect/common/utils/geo';
import type { BandSearchParams, GeocodingLookupResponse } from '@sound-connect/common/types/band-search';

export async function searchBands(db: D1Database, params: BandSearchParams, geocodedLocation: GeocodingLookupResponse | null) {
    const whereConditions = [];

    if (params.genre) {
        whereConditions.push(eq(bandsTable.primaryGenre, params.genre));
    }

    if (params.lookingFor) {
        whereConditions.push(sql`LOWER(${bandsTable.lookingFor}) LIKE LOWER(${'%' + params.lookingFor + '%'})`);
    }

    if (geocodedLocation && params.radius) {
        const bbox = calculateBoundingBox(geocodedLocation.latitude, geocodedLocation.longitude, params.radius);

        const bboxCondition = and(
            isNotNull(bandsTable.latitude),
            isNotNull(bandsTable.longitude),
            sql`${bandsTable.latitude} >= ${bbox.minLat}`,
            sql`${bandsTable.latitude} <= ${bbox.maxLat}`,
            sql`${bandsTable.longitude} >= ${bbox.minLng}`,
            sql`${bandsTable.longitude} <= ${bbox.maxLng}`
        );
        if (bboxCondition) {
            whereConditions.push(bboxCondition);
        }
    } else if (params.city) {
        whereConditions.push(eq(bandsTable.city, params.city.trim().toLowerCase()));
    }

    const memberCountSubquery = drizzle(db)
        .select({
            bandId: bandsMembersTable.bandId,
            count: sql<number>`COUNT(*)`.as('member_count')
        })
        .from(bandsMembersTable)
        .groupBy(bandsMembersTable.bandId)
        .as('member_counts');

    const results = await drizzle(db)
        .select({
            id: bandsTable.id,
            name: bandsTable.name,
            description: bandsTable.description,
            primaryGenre: bandsTable.primaryGenre,
            city: bandsTable.city,
            state: bandsTable.state,
            country: bandsTable.country,
            lookingFor: bandsTable.lookingFor,
            profileImageUrl: bandsTable.profileImageUrl,
            latitude: bandsTable.latitude,
            longitude: bandsTable.longitude,
            updatedAt: bandsTable.updatedAt,
            memberCount: sql<number>`COALESCE(${memberCountSubquery.count}, 0)`
        })
        .from(bandsTable)
        .leftJoin(memberCountSubquery, eq(bandsTable.id, memberCountSubquery.bandId))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(bandsTable.updatedAt));

    let filteredResults = results.map((row) => {
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
            id: row.id,
            name: row.name,
            description: row.description,
            primaryGenre: row.primaryGenre,
            city: row.city,
            state: row.state,
            country: row.country,
            lookingFor: row.lookingFor,
            profileImageUrl: row.profileImageUrl,
            memberCount: row.memberCount,
            distance: row.distance
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
