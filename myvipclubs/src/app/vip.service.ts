import { Injectable, computed, signal } from '@angular/core';
import { CURRENT_MEMBER, STAFF, TIERS, VENUES } from './mock-data';
import {
  CheckInEvent,
  ManagerAlert,
  Member,
  RequestStatus,
  StaffMember,
  Tier,
  Venue,
  VenueRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class VipService {
  readonly tiers = TIERS;

  private readonly _authed = signal(false);
  private readonly _member = signal<Member>(structuredClone(CURRENT_MEMBER));
  private readonly _venues = signal<Venue[]>(structuredClone(VENUES));
  private readonly _staff = signal<StaffMember[]>(structuredClone(STAFF));
  private readonly _requests = signal<VenueRequest[]>([]);
  private readonly _checkIns = signal<CheckInEvent[]>([]);
  private readonly _managerAlert = signal<ManagerAlert | null>(null);

  // ----- auth -----
  readonly isAuthenticated = this._authed.asReadonly();
  login(_email: string, _password: string): boolean {
    this._authed.set(true);
    return true;
  }
  logout(): void {
    this._authed.set(false);
  }

  // ----- member & tier -----
  readonly member = this._member.asReadonly();

  readonly lifetimeValue = computed(
    () => this._member().totalSpent + this._member().totalTips,
  );

  readonly currentTier = computed<Tier>(() => {
    const value = this.lifetimeValue();
    return [...TIERS].reverse().find((t) => value >= t.threshold) ?? TIERS[0];
  });

  readonly nextTier = computed<Tier | null>(() => {
    const idx = TIERS.findIndex((t) => t.id === this.currentTier().id);
    return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
  });

  /** 0..1 progress from the current tier threshold toward the next. */
  readonly progressToNext = computed<number>(() => {
    const next = this.nextTier();
    if (!next) return 1;
    const current = this.currentTier();
    const span = next.threshold - current.threshold;
    const gained = this.lifetimeValue() - current.threshold;
    return Math.max(0, Math.min(1, gained / span));
  });

  readonly amountToNextTier = computed<number>(() => {
    const next = this.nextTier();
    if (!next) return 0;
    return Math.max(0, next.threshold - this.lifetimeValue());
  });

  tierById(id: string): Tier | undefined {
    return TIERS.find((t) => t.id === id);
  }

  // ----- venues -----
  readonly allVenues = this._venues.asReadonly();

  venueById(id: string): Venue | undefined {
    return this._venues().find((v) => v.id === id);
  }

  readonly favoriteVenues = computed<Venue[]>(() => {
    const favs = this._member().favoriteVenueIds;
    return this._venues().filter((v) => favs.includes(v.id));
  });

  /** Venues the member does not yet have access to — can request the hookup. */
  readonly discoverVenues = computed<Venue[]>(() =>
    this._venues().filter((v) => !v.isMember),
  );

  isFavoriteVenue(id: string): boolean {
    return this._member().favoriteVenueIds.includes(id);
  }

  toggleFavoriteVenue(id: string): void {
    this._member.update((m) => {
      const favs = new Set(m.favoriteVenueIds);
      favs.has(id) ? favs.delete(id) : favs.add(id);
      return { ...m, favoriteVenueIds: [...favs] };
    });
  }

  // ----- staff (my people) -----
  readonly favoriteStaff = computed<StaffMember[]>(() => {
    const favs = this._member().favoriteStaffIds;
    return this._staff().filter((s) => favs.includes(s.id));
  });

  staffForVenue(venueId: string): StaffMember[] {
    return this._staff().filter((s) => s.venueId === venueId);
  }

  // ----- venue access requests -----
  readonly requests = this._requests.asReadonly();

  requestStatus(venueId: string): RequestStatus | null {
    return this._requests().find((r) => r.venueId === venueId)?.status ?? null;
  }

  requestVenue(venueId: string): void {
    if (this.requestStatus(venueId)) return;
    this._requests.update((rs) => [
      ...rs,
      { venueId, status: 'requested', requestedAt: Date.now() },
    ]);
    // Simulate the concierge picking it up.
    setTimeout(() => this.advanceRequest(venueId, 'in_review'), 1600);
  }

  private advanceRequest(venueId: string, status: RequestStatus): void {
    this._requests.update((rs) =>
      rs.map((r) => (r.venueId === venueId ? { ...r, status } : r)),
    );
  }

  // ----- check-in / manager recognition -----
  readonly checkIns = this._checkIns.asReadonly();
  readonly managerAlert = this._managerAlert.asReadonly();

  /**
   * Member taps "I'm here" (or GPS detects arrival). This creates the alert
   * the venue manager receives as a push notification.
   */
  checkIn(venueId: string): ManagerAlert | null {
    const venue = this.venueById(venueId);
    if (!venue) return null;

    const event: CheckInEvent = {
      id: 'ci_' + Date.now(),
      venueId,
      venueName: venue.name,
      at: Date.now(),
      status: 'notified',
    };
    this._checkIns.update((c) => [event, ...c]);

    const alert: ManagerAlert = {
      memberId: this._member().id,
      venueId,
      venueName: venue.name,
      distanceMiles: venue.distanceMiles ?? 0.2,
      etaMinutes: Math.max(1, Math.round((venue.distanceMiles ?? 0.2) * 4)),
      at: Date.now(),
    };
    this._managerAlert.set(alert);
    return alert;
  }

  markWelcomed(venueId: string): void {
    this._checkIns.update((c) =>
      c.map((e) => (e.venueId === venueId ? { ...e, status: 'welcomed' } : e)),
    );
  }

  clearManagerAlert(): void {
    this._managerAlert.set(null);
  }

  // ----- profile edits -----
  updatePreferences(patch: Partial<Member['preferences']>): void {
    this._member.update((m) => ({
      ...m,
      preferences: { ...m.preferences, ...patch },
    }));
  }
}
