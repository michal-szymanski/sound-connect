export type BoundingBox = {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
};

export function calculateBoundingBox(latitude: number, longitude: number, radiusMiles: number): BoundingBox {
    const radiusKm = radiusMiles * 1.60934;
    const earthRadiusKm = 6371;

    const latDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI);
    const lngDelta = (radiusKm / (earthRadiusKm * Math.cos((latitude * Math.PI) / 180))) * (180 / Math.PI);

    return {
        minLat: latitude - latDelta,
        maxLat: latitude + latDelta,
        minLng: longitude - lngDelta,
        maxLng: longitude + lngDelta
    };
}

export function calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = earthRadiusKm * c;

    return distanceKm * 0.621371;
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

export function milesToKilometers(miles: number): number {
    return miles * 1.60934;
}

export function kilometersToMiles(km: number): number {
    return km * 0.621371;
}
