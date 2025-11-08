import { drizzle } from 'drizzle-orm/d1';
import { eq, and, or, sql, isNotNull, desc } from 'drizzle-orm';
import { musicGroupsTable, musicGroupMembersTable } from '@/drizzle/schema';
import { calculateBoundingBox, calculateHaversineDistance } from '@sound-connect/common/utils/geo';
import type { BandSearchParams, GeocodingLookupResponse } from '@sound-connect/common/types/band-search';

export async function searchBands(db: D1Database, params: BandSearchParams, geocodedLocation: GeocodingLookupResponse | null) {
    const whereConditions = [];

    if (params.genre) {
        whereConditions.push(eq(musicGroupsTable.primaryGenre, params.genre));
    }

    if (params.lookingFor) {
        whereConditions.push(sql`LOWER(${musicGroupsTable.lookingFor}) LIKE LOWER(${'%' + params.lookingFor + '%'})`);
    }

    if (geocodedLocation && params.radius) {
        const bbox = calculateBoundingBox(geocodedLocation.latitude, geocodedLocation.longitude, params.radius);

        const bboxCondition = and(
            isNotNull(musicGroupsTable.latitude),
            isNotNull(musicGroupsTable.longitude),
            sql`${musicGroupsTable.latitude} >= ${bbox.minLat}`,
            sql`${musicGroupsTable.latitude} <= ${bbox.maxLat}`,
            sql`${musicGroupsTable.longitude} >= ${bbox.minLng}`,
            sql`${musicGroupsTable.longitude} <= ${bbox.maxLng}`
        );
        if (bboxCondition) {
            whereConditions.push(bboxCondition);
        }
    } else if (params.city) {
        whereConditions.push(eq(musicGroupsTable.city, params.city.trim().toLowerCase()));
    }

    const memberCountSubquery = drizzle(db)
        .select({
            musicGroupId: musicGroupMembersTable.musicGroupId,
            count: sql<number>`COUNT(*)`.as('member_count')
        })
        .from(musicGroupMembersTable)
        .groupBy(musicGroupMembersTable.musicGroupId)
        .as('member_counts');

    const results = await drizzle(db)
        .select({
            id: musicGroupsTable.id,
            name: musicGroupsTable.name,
            description: musicGroupsTable.description,
            primaryGenre: musicGroupsTable.primaryGenre,
            city: musicGroupsTable.city,
            state: musicGroupsTable.state,
            country: musicGroupsTable.country,
            lookingFor: musicGroupsTable.lookingFor,
            profileImageUrl: musicGroupsTable.profileImageUrl,
            latitude: musicGroupsTable.latitude,
            longitude: musicGroupsTable.longitude,
            updatedAt: musicGroupsTable.updatedAt,
            memberCount: sql<number>`COALESCE(${memberCountSubquery.count}, 0)`
        })
        .from(musicGroupsTable)
        .leftJoin(memberCountSubquery, eq(musicGroupsTable.id, memberCountSubquery.musicGroupId))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(musicGroupsTable.updatedAt));

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
