import { Injectable, inject } from '@angular/core';
import { NgZone } from '@angular/core';
import { VipService } from '../vip.service';
import { DEFAULT_GEOFENCE_RADIUS } from './pushwoosh.config';
import { getGeofence, getPushwoosh, isCordova, whenDeviceReady } from './platform';

const TRANSITION_ENTER = 1;

/**
 * Uses cordova-plugin-geofence to watch a native geofence around every venue
 * the member has access to. When the device enters a venue's region, we fire
 * the check-in — the same "I'm here" action the button triggers — which is
 * what alerts the venue manager (via the backend / Pushwoosh) before the
 * member reaches the door.
 *
 * Pushwoosh's own location "geozones" are also started so server-side geo
 * pushes work; the two are complementary.
 *
 * Inert on the web.
 */
@Injectable({ providedIn: 'root' })
export class GeofenceService {
  private vip = inject(VipService);
  private zone = inject(NgZone);
  private initialised = false;

  async init(): Promise<void> {
    if (this.initialised || !isCordova()) return;
    this.initialised = true;

    await whenDeviceReady();
    const geofence = getGeofence();
    if (!geofence) return;

    try {
      await geofence.initialize();

      geofence.onTransitionReceived = (regions) => {
        // Bring the callback back into Angular's zone so signals/router update.
        this.zone.run(() => {
          for (const region of regions) {
            if (region.transitionType === TRANSITION_ENTER) {
              this.onEnterVenue(region.id);
            }
          }
        });
      };

      await this.armVenueGeofences();

      // Start Pushwoosh geozones for server-driven geo pushes.
      getPushwoosh()?.startLocationTracking();
    } catch (e) {
      console.warn('[Geofence] init failed', e);
    }
  }

  /** Register a geofence for each venue the member can enter. */
  async armVenueGeofences(): Promise<void> {
    const geofence = getGeofence();
    if (!geofence) return;

    const venues = this.vip.allVenues().filter((v) => v.isMember);
    const fences = venues.map((v) => ({
      id: v.id,
      latitude: v.lat,
      longitude: v.lng,
      radius: v.geofenceRadius ?? DEFAULT_GEOFENCE_RADIUS,
      transitionType: TRANSITION_ENTER,
      notification: {
        title: 'My VIP Clubs',
        text: `You've arrived at ${v.name}. Notifying the venue…`,
        openAppOnClick: true,
        data: { screen: 'venue', venueId: v.id },
      },
    }));

    try {
      await geofence.addOrUpdate(fences);
    } catch (e) {
      console.warn('[Geofence] addOrUpdate failed', e);
    }
  }

  private onEnterVenue(venueId: string): void {
    const venue = this.vip.venueById(venueId);
    if (!venue) return;
    // Same effect as the member tapping "I'm here": create the manager alert.
    this.vip.checkIn(venueId);
    // In production this is where you'd POST to your backend / Pushwoosh Remote
    // API to deliver the "VIP arriving" push to the venue manager's device.
  }

  async clear(): Promise<void> {
    try {
      await getGeofence()?.removeAll();
      getPushwoosh()?.stopLocationTracking();
    } catch (e) {
      console.warn('[Geofence] clear failed', e);
    }
  }
}
