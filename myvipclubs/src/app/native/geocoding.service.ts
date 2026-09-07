import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GOOGLE_CONFIG } from './google.config';

export interface LatLng {
  lat: number;
  lng: number;
}

interface GoogleGeocodeResponse {
  status: string;
  results: Array<{
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
  }>;
  error_message?: string;
}

/**
 * Resolves a street address to coordinates via the Google Geocoding API.
 *
 * Venues in this app already ship with baked-in coordinates, so the app runs
 * with no key. When you add a NEW venue (which only has an address), call
 * `geocode()` / `geocodeVenue()` to fill in `lat`/`lng`. Set the key in
 * `google.config.ts`.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private http = inject(HttpClient);
  private cache = new Map<string, LatLng>();

  get isConfigured(): boolean {
    return GOOGLE_CONFIG.geocodingApiKey.trim().length > 0;
  }

  /** Geocode an address string. Returns null if not configured or not found. */
  async geocode(address: string): Promise<LatLng | null> {
    const key = address.trim().toLowerCase();
    if (this.cache.has(key)) return this.cache.get(key)!;
    if (!this.isConfigured) {
      console.warn('[Geocoding] no Google API key set (google.config.ts).');
      return null;
    }

    const url =
      'https://maps.googleapis.com/maps/api/geocode/json' +
      `?address=${encodeURIComponent(address)}` +
      `&key=${GOOGLE_CONFIG.geocodingApiKey}`;

    try {
      const res = await firstValueFrom(this.http.get<GoogleGeocodeResponse>(url));
      if (res.status !== 'OK' || !res.results.length) {
        console.warn('[Geocoding] failed:', res.status, res.error_message ?? '');
        return null;
      }
      const loc = res.results[0].geometry.location;
      const result: LatLng = { lat: loc.lat, lng: loc.lng };
      this.cache.set(key, result);
      return result;
    } catch (e) {
      console.warn('[Geocoding] request error', e);
      return null;
    }
  }

  /**
   * Fill a venue's coordinates from its address. No-op (returns the venue
   * unchanged) when geocoding isn't configured or the address can't be found —
   * so existing baked-in coordinates are preserved.
   */
  async geocodeVenue<T extends { address: string; lat?: number; lng?: number }>(
    venue: T,
  ): Promise<T> {
    const coords = await this.geocode(venue.address);
    return coords ? { ...venue, lat: coords.lat, lng: coords.lng } : venue;
  }
}
