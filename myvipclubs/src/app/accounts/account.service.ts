import { Injectable, computed, inject, signal } from '@angular/core';
import { VipService } from '../vip.service';
import { GeocodingService } from '../native/geocoding.service';
import { NotificationService } from '../notify/notification.service';
import {
  Account,
  AccountRole,
  MembershipStatus,
  StaffMembership,
  StaffRole,
  VenueRegistration,
} from './account.models';
import { Venue } from '../models';

const DEFAULT_COORDS = { lat: 25.7743, lng: -80.1937 }; // Miami center fallback

@Injectable({ providedIn: 'root' })
export class AccountService {
  private vip = inject(VipService);
  private geo = inject(GeocodingService);
  private notify = inject(NotificationService);

  private _accounts = signal<Account[]>(SEED_ACCOUNTS());
  private _memberships = signal<StaffMembership[]>(SEED_MEMBERSHIPS());
  private _venueRegs = signal<VenueRegistration[]>(SEED_VENUE_REGS());
  private _current = signal<Account | null>(null);

  readonly currentAccount = this._current.asReadonly();
  readonly accounts = this._accounts.asReadonly();

  // ------------- session -------------
  login(email: string, password: string): Account | null {
    const acct = this._accounts().find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
    );
    if (acct) this._current.set(acct);
    return acct ?? null;
  }

  loginAs(accountId: string): Account | null {
    const acct = this.accountById(accountId);
    this._current.set(acct ?? null);
    return acct ?? null;
  }

  logout(): void {
    this._current.set(null);
  }

  accountById(id: string): Account | undefined {
    return this._accounts().find((a) => a.id === id);
  }

  // ------------- lookups for notifications -------------
  /** Owner + managers of a venue (they receive staff/access alerts). */
  venueAdminsFor(venueId: string): Account[] {
    return this._accounts().filter(
      (a) => a.venueId === venueId && (a.role === 'owner' || a.role === 'manager'),
    );
  }

  private venueAdminPhones(venueId: string): string[] {
    return this.venueAdminsFor(venueId).map((a) => a.phone);
  }

  private adminPhones(): string[] {
    return this._accounts().filter((a) => a.role === 'admin').map((a) => a.phone);
  }

  // ------------- registration -------------
  registerMember(input: { name: string; email: string; phone: string; password: string }): Account {
    const acct: Account = {
      id: 'acct_' + Date.now(),
      role: 'member',
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
    };
    this._accounts.update((a) => [...a, acct]);
    this._current.set(acct);
    return acct;
  }

  /** Register a venue — creates the owner account + a pending registration. */
  registerVenue(input: {
    venueName: string;
    type: Venue['type'];
    address: string;
    neighborhood: string;
    city: string;
    ownerName: string;
    email: string;
    phone: string;
    password: string;
  }): VenueRegistration {
    const owner: Account = {
      id: 'acct_' + Date.now(),
      role: 'owner',
      name: input.ownerName,
      email: input.email,
      phone: input.phone,
      password: input.password,
    };
    const reg: VenueRegistration = {
      id: 'vreg_' + Date.now(),
      name: input.venueName,
      type: input.type,
      address: input.address,
      neighborhood: input.neighborhood,
      city: input.city,
      ownerAccountId: owner.id,
      ownerName: input.ownerName,
      status: 'pending',
      createdAt: Date.now(),
    };
    this._accounts.update((a) => [...a, owner]);
    this._venueRegs.update((r) => [...r, reg]);
    this._current.set(owner);

    this.notify.notify({
      audience: { kind: 'role', role: 'admin' },
      type: 'venue_pending_review',
      title: 'New venue awaiting review',
      body: `${reg.name} (${reg.neighborhood}) registered by ${reg.ownerName}.`,
      deepLink: '/admin',
      sms: {
        to: this.adminPhones(),
        body: `My VIP Clubs: ${reg.name} just registered and needs review. Open the admin portal to approve.`,
      },
    });
    return reg;
  }

  /** Register a staff member — creates the account + a pending membership. */
  registerStaff(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    venueId: string;
    role: StaffRole;
  }): StaffMembership {
    const acct: Account = {
      id: 'acct_' + Date.now(),
      role: 'staff',
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
      venueId: input.venueId,
    };
    const membership: StaffMembership = {
      id: 'mem_' + Date.now(),
      accountId: acct.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      venueId: input.venueId,
      role: input.role,
      status: 'pending',
      requestedAt: Date.now(),
    };
    this._accounts.update((a) => [...a, acct]);
    this._memberships.update((m) => [...m, membership]);
    this._current.set(acct);

    const venue = this.vip.venueById(input.venueId);
    this.notify.notify({
      audience: { kind: 'venue', venueId: input.venueId },
      type: 'staff_join_request',
      title: 'Staff join request',
      body: `${input.name} (${input.role}) wants to join your team.`,
      deepLink: `/venue-portal/${input.venueId}`,
      sms: {
        to: this.venueAdminPhones(input.venueId),
        body: `My VIP Clubs: ${input.name} requested to join ${venue?.name ?? 'your venue'} as ${input.role}. Approve or decline in the venue portal.`,
      },
    });
    return membership;
  }

  // ------------- staff approval (owner + managers) -------------
  membershipsForVenue(venueId: string): StaffMembership[] {
    return this._memberships().filter((m) => m.venueId === venueId);
  }

  pendingStaffForVenue(venueId: string): StaffMembership[] {
    return this.membershipsForVenue(venueId).filter((m) => m.status === 'pending');
  }

  approvedStaffForVenue(venueId: string): StaffMembership[] {
    return this.membershipsForVenue(venueId).filter((m) => m.status === 'approved');
  }

  membershipById(id: string): StaffMembership | undefined {
    return this._memberships().find((m) => m.id === id);
  }

  membershipForAccount(accountId: string): StaffMembership | undefined {
    return this._memberships().find((m) => m.accountId === accountId);
  }

  decideStaff(membershipId: string, status: MembershipStatus, byAccountId?: string): void {
    let decided: StaffMembership | undefined;
    this._memberships.update((ms) =>
      ms.map((m) => {
        if (m.id !== membershipId) return m;
        decided = { ...m, status, decidedByAccountId: byAccountId };
        return decided;
      }),
    );
    if (!decided) return;
    const venue = this.vip.venueById(decided.venueId);
    const approved = status === 'approved';

    // Add approved staff to the venue's live roster.
    if (approved) {
      const initials = decided.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      this.vip.addStaff({
        id: decided.accountId,
        name: decided.name,
        role: decided.role === 'Manager' ? 'Event Manager' : decided.role,
        venueId: decided.venueId,
        venueName: venue?.name ?? '',
        avatar: initials,
      });
    }
    this.notify.notify({
      audience: { kind: 'account', accountId: decided.accountId },
      type: approved ? 'staff_approved' : 'staff_declined',
      title: approved ? 'You’re on the team' : 'Request not approved',
      body: approved
        ? `${venue?.name ?? 'The venue'} approved you as ${decided.role}.`
        : `${venue?.name ?? 'The venue'} declined your staff request.`,
      deepLink: `/staff-status/${decided.id}`,
      sms: {
        to: [decided.phone],
        body: approved
          ? `My VIP Clubs: You're confirmed as ${decided.role} at ${venue?.name ?? 'the venue'}. You'll now get VIP arrival alerts.`
          : `My VIP Clubs: Your request to join ${venue?.name ?? 'the venue'} was not approved.`,
      },
    });
  }

  // ------------- venue vetting (platform admin) -------------
  readonly pendingVenues = computed(() => this._venueRegs().filter((r) => r.status === 'pending'));
  venueRegs(): VenueRegistration[] {
    return [...this._venueRegs()].sort((a, b) => b.createdAt - a.createdAt);
  }

  async approveVenue(regId: string): Promise<void> {
    const reg = this._venueRegs().find((r) => r.id === regId);
    if (!reg || reg.status !== 'pending') return;

    this.setVenueRegStatus(regId, 'approved');

    // Turn the registration into a live venue (geocode when a key is present).
    const id = this.vip.nextVenueId();
    const coords = (await this.geo.geocode(reg.address)) ?? DEFAULT_COORDS;
    const venue: Venue = {
      id,
      name: reg.name,
      type: reg.type,
      address: reg.address,
      neighborhood: reg.neighborhood,
      city: reg.city,
      image: '🥂',
      vibe: 'Newly added to My VIP Clubs',
      memberTierRequired: 'silver',
      isMember: false,
      distanceMiles: 1,
      lat: coords.lat,
      lng: coords.lng,
      geofenceRadius: 250,
    };
    this.vip.addVenue(venue);
    // Attach the owner to the new venue.
    this._accounts.update((as) =>
      as.map((a) => (a.id === reg.ownerAccountId ? { ...a, venueId: id } : a)),
    );

    this.notify.notify({
      audience: { kind: 'account', accountId: reg.ownerAccountId },
      type: 'venue_approved',
      title: 'Your venue is live',
      body: `${reg.name} is approved and now on My VIP Clubs.`,
      deepLink: `/venue-portal/${id}`,
      sms: {
        to: [this.accountById(reg.ownerAccountId)?.phone ?? ''],
        body: `My VIP Clubs: ${reg.name} is approved and live. Open the venue portal to manage your team and VIPs.`,
      },
    });
  }

  declineVenue(regId: string): void {
    const reg = this._venueRegs().find((r) => r.id === regId);
    if (!reg || reg.status !== 'pending') return;
    this.setVenueRegStatus(regId, 'declined');
    this.notify.notify({
      audience: { kind: 'account', accountId: reg.ownerAccountId },
      type: 'venue_declined',
      title: 'Registration not approved',
      body: `${reg.name} was not approved at this time.`,
      sms: {
        to: [this.accountById(reg.ownerAccountId)?.phone ?? ''],
        body: `My VIP Clubs: ${reg.name}'s registration was not approved at this time.`,
      },
    });
  }

  private setVenueRegStatus(regId: string, status: MembershipStatus): void {
    this._venueRegs.update((rs) => rs.map((r) => (r.id === regId ? { ...r, status } : r)));
  }
}

// =====================================================================
//  Seed data (interim / demo)
// =====================================================================
function SEED_ACCOUNTS(): Account[] {
  return [
    { id: 'acct_admin', role: 'admin', name: 'MVC Admin', email: 'admin@myvipclubs.app', phone: '+13055550100', password: 'admin' },
    { id: 'acct_member_alex', role: 'member', name: 'Alex Morgan', email: 'brandechomedia@gmail.com', phone: '+13055550111', password: 'demo', memberId: 'm1' },
    // Velvet Room (v2) owner + a manager (both can approve staff)
    { id: 'acct_owner_v2', role: 'owner', name: 'Elena Cruz', email: 'elena@velvetroom.com', phone: '+13055550122', password: 'demo', venueId: 'v2' },
    { id: 'acct_mgr_v2', role: 'manager', name: 'Sofia Marín', email: 'sofia@velvetroom.com', phone: '+13055550133', password: 'demo', venueId: 'v2' },
    // Skyline 88 (v1) owner
    { id: 'acct_owner_v1', role: 'owner', name: 'Marcus Reed', email: 'marcus@skyline88.com', phone: '+13055550144', password: 'demo', venueId: 'v1' },
    // An approved staff account + a pending one at Velvet Room
    { id: 'acct_staff_diego', role: 'staff', name: 'Diego Rivera', email: 'diego@velvetroom.com', phone: '+13055550155', password: 'demo', venueId: 'v2' },
    { id: 'acct_staff_nina', role: 'staff', name: 'Nina Torres', email: 'nina@example.com', phone: '+13055550166', password: 'demo', venueId: 'v2' },
    // Owner of the venue awaiting platform vetting (see SEED_VENUE_REGS).
    { id: 'acct_owner_pending', role: 'owner', name: 'Priya Shah', email: 'priya@lumenrooftop.com', phone: '+13055550177', password: 'demo' },
  ];
}

function SEED_MEMBERSHIPS(): StaffMembership[] {
  return [
    { id: 'mem_diego', accountId: 'acct_staff_diego', name: 'Diego Rivera', email: 'diego@velvetroom.com', phone: '+13055550155', venueId: 'v2', role: 'Bartender', status: 'approved', requestedAt: Date.now() - 86400_000 * 30 },
    // Pending request awaiting owner/manager approval — the demo case.
    { id: 'mem_nina', accountId: 'acct_staff_nina', name: 'Nina Torres', email: 'nina@example.com', phone: '+13055550166', venueId: 'v2', role: 'Server', status: 'pending', requestedAt: Date.now() - 3600_000 },
  ];
}

function SEED_VENUE_REGS(): VenueRegistration[] {
  return [
    // A venue awaiting platform admin vetting — the demo case.
    {
      id: 'vreg_lumen',
      name: 'Lumen Rooftop',
      type: 'Rooftop',
      address: '1100 Biscayne Blvd, Miami, FL 33132',
      neighborhood: 'Edgewater',
      city: 'Miami',
      ownerAccountId: 'acct_owner_pending',
      ownerName: 'Priya Shah',
      status: 'pending',
      createdAt: Date.now() - 7200_000,
    },
  ];
}
