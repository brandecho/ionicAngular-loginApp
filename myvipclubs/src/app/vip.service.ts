import { Injectable, computed, signal } from '@angular/core';
import { MEMBERS, SEED_REQUESTS, STAFF, TIERS, VENUES } from './mock-data';
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
  private readonly currentMemberId = 'm1';

  private readonly _authed = signal(false);
  private readonly _members = signal<Member[]>(structuredClone(MEMBERS));
  private readonly _venues = signal<Venue[]>(structuredClone(VENUES));
  private readonly _staff = signal<StaffMember[]>(structuredClone(STAFF));
  private readonly _requests = signal<VenueRequest[]>(structuredClone(SEED_REQUESTS));
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

  // ----- members -----
  readonly members = this._members.asReadonly();

  readonly member = computed<Member>(
    () => this._members().find((m) => m.id === this.currentMemberId) ?? this._members()[0],
  );

  memberById(id: string): Member | undefined {
    return this._members().find((m) => m.id === id);
  }

  lifetimeValueOf(m: Member): number {
    return m.totalSpent + m.totalTips;
  }

  tierForValue(value: number): Tier {
    return [...TIERS].reverse().find((t) => value >= t.threshold) ?? TIERS[0];
  }

  tierForMember(m: Member): Tier {
    return this.tierForValue(this.lifetimeValueOf(m));
  }

  // ----- current member tier -----
  readonly lifetimeValue = computed(() => this.lifetimeValueOf(this.member()));
  readonly currentTier = computed<Tier>(() => this.tierForMember(this.member()));

  readonly nextTier = computed<Tier | null>(() => {
    const idx = TIERS.findIndex((t) => t.id === this.currentTier().id);
    return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
  });

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
    return next ? Math.max(0, next.threshold - this.lifetimeValue()) : 0;
  });

  tierById(id: string): Tier | undefined {
    return TIERS.find((t) => t.id === id);
  }

  // ----- venues -----
  readonly allVenues = this._venues.asReadonly();

  venueById(id: string): Venue | undefined {
    return this._venues().find((v) => v.id === id);
  }

  /** Add a newly-approved venue to the live catalogue. */
  addVenue(venue: Venue): void {
    this._venues.update((vs) => (vs.some((v) => v.id === venue.id) ? vs : [...vs, venue]));
  }

  nextVenueId(): string {
    return 'v' + (this._venues().length + 1);
  }

  readonly favoriteVenues = computed<Venue[]>(() => {
    const favs = this.member().favoriteVenueIds;
    return this._venues().filter((v) => favs.includes(v.id));
  });

  /** Venues the current member does not yet have access to. */
  readonly discoverVenues = computed<Venue[]>(() => {
    const favs = this.member().favoriteVenueIds;
    return this._venues().filter((v) => !favs.includes(v.id));
  });

  isFavoriteVenue(id: string): boolean {
    return this.member().favoriteVenueIds.includes(id);
  }

  toggleFavoriteVenue(id: string): void {
    this.updateMember(this.currentMemberId, (m) => {
      const favs = new Set(m.favoriteVenueIds);
      favs.has(id) ? favs.delete(id) : favs.add(id);
      return { ...m, favoriteVenueIds: [...favs] };
    });
  }

  // ----- staff -----
  readonly favoriteStaff = computed<StaffMember[]>(() => {
    const favs = this.member().favoriteStaffIds;
    return this._staff().filter((s) => favs.includes(s.id));
  });

  staffForVenue(venueId: string): StaffMember[] {
    return this._staff().filter((s) => s.venueId === venueId);
  }

  addStaff(staff: StaffMember): void {
    this._staff.update((list) => (list.some((s) => s.id === staff.id) ? list : [...list, staff]));
  }

  // ===================================================================
  //  Venue-side (portal) queries
  // ===================================================================

  /** Members who have access to (frequent) a venue — the VIP roster. */
  membersForVenue(venueId: string): Member[] {
    return this._members()
      .filter((m) => m.favoriteVenueIds.includes(venueId))
      .sort((a, b) => this.lifetimeValueOf(b) - this.lifetimeValueOf(a));
  }

  /** Members currently inbound to a venue (seeded arrivals + live check-ins). */
  arrivingMembersForVenue(venueId: string): Array<{ member: Member; etaMinutes: number }> {
    const out: Array<{ member: Member; etaMinutes: number }> = [];
    for (const m of this._members()) {
      if (m.arriving?.venueId === venueId) {
        out.push({ member: m, etaMinutes: m.arriving.etaMinutes });
      }
    }
    // Live check-in by the current member also counts as arriving.
    const live = this._checkIns().find(
      (c) => c.venueId === venueId && c.status !== 'welcomed',
    );
    if (live && !out.some((o) => o.member.id === this.currentMemberId)) {
      out.unshift({
        member: this.member(),
        etaMinutes: this._managerAlert()?.etaMinutes ?? 2,
      });
    }
    return out.sort((a, b) => a.etaMinutes - b.etaMinutes);
  }

  // ===================================================================
  //  Access requests (member <-> venue workflow)
  // ===================================================================
  readonly requests = this._requests.asReadonly();

  /** Request status for the CURRENT member at a venue. */
  requestStatus(venueId: string): RequestStatus | null {
    return (
      this._requests().find(
        (r) => r.venueId === venueId && r.memberId === this.currentMemberId,
      )?.status ?? null
    );
  }

  /** Current member asks for the hookup at a venue. */
  requestVenue(venueId: string, note?: string): void {
    if (this.requestStatus(venueId)) return;
    this._requests.update((rs) => [
      ...rs,
      {
        memberId: this.currentMemberId,
        venueId,
        status: 'requested',
        requestedAt: Date.now(),
        note,
      },
    ]);
  }

  /** Pending requests a venue still needs to act on. */
  pendingRequestsForVenue(venueId: string): VenueRequest[] {
    return this._requests().filter(
      (r) => r.venueId === venueId && (r.status === 'requested' || r.status === 'in_review'),
    );
  }

  /** Venue approves a request: the member is granted access. */
  approveRequest(memberId: string, venueId: string): void {
    this.setRequestStatus(memberId, venueId, 'approved');
    this.grantAccess(memberId, venueId);
  }

  /** Venue declines a request. */
  declineRequest(memberId: string, venueId: string): void {
    this.setRequestStatus(memberId, venueId, 'declined');
  }

  private setRequestStatus(memberId: string, venueId: string, status: RequestStatus): void {
    this._requests.update((rs) =>
      rs.map((r) =>
        r.memberId === memberId && r.venueId === venueId ? { ...r, status } : r,
      ),
    );
  }

  private grantAccess(memberId: string, venueId: string): void {
    this.updateMember(memberId, (m) =>
      m.favoriteVenueIds.includes(venueId)
        ? m
        : { ...m, favoriteVenueIds: [...m.favoriteVenueIds, venueId] },
    );
    if (memberId === this.currentMemberId) {
      this._venues.update((vs) =>
        vs.map((v) => (v.id === venueId ? { ...v, isMember: true } : v)),
      );
    }
  }

  // ===================================================================
  //  Check-in / recognition (current member)
  // ===================================================================
  readonly checkIns = this._checkIns.asReadonly();
  readonly managerAlert = this._managerAlert.asReadonly();

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
      memberId: this.member().id,
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

  // ----- profile edits (current member) -----
  updatePreferences(patch: Partial<Member['preferences']>): void {
    this.updateMember(this.currentMemberId, (m) => ({
      ...m,
      preferences: { ...m.preferences, ...patch },
    }));
  }

  // ----- helpers -----
  private updateMember(id: string, fn: (m: Member) => Member): void {
    this._members.update((ms) => ms.map((m) => (m.id === id ? fn(m) : m)));
  }
}
