import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { VipService } from '../vip.service';
import { PUSHWOOSH_CONFIG } from './pushwoosh.config';
import { getPushwoosh, isCordova, whenDeviceReady } from './platform';

/**
 * Wraps the Pushwoosh Cordova plugin.
 *
 * Responsibilities:
 *  - initialise Pushwoosh and register the device for push,
 *  - tag the device with the signed-in member id so the backend can target it,
 *  - route an opened push to the right screen (e.g. a manager opening the
 *    "VIP arriving" recognition alert deep-links to /manager/:memberId).
 *
 * All calls are guarded: on the web this class is inert.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  private router = inject(Router);
  private vip = inject(VipService);

  private pushToken: string | null = null;
  private initialised = false;

  async init(): Promise<void> {
    if (this.initialised || !isCordova()) return;
    this.initialised = true;

    await whenDeviceReady();
    const pw = getPushwoosh();
    if (!pw) return;

    // Listen for pushes before registering so nothing is missed.
    document.addEventListener('push-notification', (event: any) => {
      this.handlePush(event?.notification);
    });

    pw.onDeviceReady({
      appid: PUSHWOOSH_CONFIG.appId,
      projectid: PUSHWOOSH_CONFIG.projectId,
    });

    pw.registerDevice(
      (status) => {
        this.pushToken = status.pushToken;
        this.tagCurrentMember();
      },
      (error) => console.warn('[Pushwoosh] register failed', error),
    );
  }

  /** Tag this device with the member id so pushes can target this person. */
  tagCurrentMember(): void {
    const pw = getPushwoosh();
    if (!pw) return;
    const member = this.vip.member();
    try {
      pw.setUserId(member.id);
      pw.setTags({ memberId: member.id, tier: this.vip.currentTier().id });
    } catch (e) {
      console.warn('[Pushwoosh] tagging failed', e);
    }
  }

  getToken(): string | null {
    return this.pushToken;
  }

  /**
   * Handle a received / opened push. Pushwoosh delivers a `userdata` payload;
   * we use it to deep-link. Expected shapes:
   *   { screen: 'manager', memberId: 'm1', venueId: 'v2' }
   *   { screen: 'venue', venueId: 'v2' }
   */
  private handlePush(notification: PushwooshNotification | undefined): void {
    if (!notification) return;
    const opened = notification.onStart === true; // tapped, not just received
    let data = notification.userdata;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        data = undefined;
      }
    }
    if (!opened || !data) return;

    switch (data.screen) {
      case 'manager':
        this.router.navigate(['/manager', data.memberId ?? this.vip.member().id], {
          queryParams: data.venueId ? { venue: data.venueId } : {},
        });
        break;
      case 'venue':
        if (data.venueId) this.router.navigate(['/venue', data.venueId]);
        break;
      default:
        this.router.navigateByUrl('/tabs/home');
    }
  }
}
