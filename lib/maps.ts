/**
 * Lazily loads the Google Maps JS API (with Places library) exactly once.
 * Any component can call `loadGoogleMaps()` and await the returned promise.
 */

let _promise: Promise<void> | null = null;

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();

  if (!_promise) {
    _promise = new Promise<void>((resolve, reject) => {
      // Unique global callback name
      (window as unknown as Record<string, unknown>)["__googleMapsReady"] = resolve;

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=__googleMapsReady`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("Failed to load Google Maps."));
      document.head.appendChild(script);
    });
  }

  return _promise;
}

/**
 * Returns a Static Maps image URL for a given lat/lng — no JS needed, just an <img>.
 */
export function staticMapUrl(lat: number, lng: number, zoom = 15, size = "600x300"): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&markers=color:0xcdfa47%7C${lat},${lng}&style=element:geometry%7Ccolor:0x1a1a1a&style=element:labels.text.fill%7Ccolor:0xcdfa47&key=${key}`;
}

/**
 * Opens Google Maps directions in a new tab.
 */
export function googleMapsUrl(address: string, city: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}`)}`;
}
