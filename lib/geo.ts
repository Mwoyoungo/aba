export interface Coordinates {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine formula — returns straight-line distance in km between two coordinates.
 * Good enough for proximity ranking within a city / region.
 */
export function getDistanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const chord =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

/** Human-readable distance label */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

/**
 * Ask the browser for the user's current position.
 * Resolves with coordinates, rejects if denied or unsupported.
 */
export function getUserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this environment."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 10_000, maximumAge: 60_000 }
    );
  });
}

/**
 * Sort an array of items that have lat/lng by distance from the user.
 * Items without coordinates are pushed to the end.
 */
export function sortByProximity<T extends { lat: number; lng: number; distanceKm?: number }>(
  items: T[],
  userCoords: Coordinates
): T[] {
  return items
    .map((item) => ({
      ...item,
      distanceKm: getDistanceKm(userCoords, { lat: item.lat, lng: item.lng }),
    }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
}
