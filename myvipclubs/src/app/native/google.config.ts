/**
 * Google Maps Platform key, used by GeocodingService to turn a venue's street
 * address into { lat, lng }. Leave blank to run without geocoding — venues fall
 * back to any coordinates baked into the data.
 *
 * Create/restrict a key at https://console.cloud.google.com (enable the
 * "Geocoding API"). For production, prefer geocoding server-side so the key is
 * never shipped in the client.
 */
export const GOOGLE_CONFIG = {
  geocodingApiKey: '',
} as const;
