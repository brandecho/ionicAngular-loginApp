import { Venue } from '../models';

/** Platform-wide role. Venue power follows owner > manager > staff. */
export type AccountRole = 'member' | 'owner' | 'manager' | 'staff' | 'admin';

export type StaffRole = 'Manager' | 'Bartender' | 'Server' | 'Host' | 'Sommelier' | 'Security';

export type MembershipStatus = 'pending' | 'approved' | 'declined';

export interface Account {
  id: string;
  role: AccountRole;
  name: string;
  email: string;
  phone: string; // E.164, used for SMS notifications
  password: string; // MOCK ONLY — never store plaintext in production
  /** For owner/manager/staff: the venue they belong to. */
  venueId?: string;
  /** Links to the current VIP member record (role === 'member'). */
  memberId?: string;
}

/**
 * A staff member's request to be part of a venue. Owner + Managers of that venue
 * confirm it before the staff can receive VIP alerts.
 */
export interface StaffMembership {
  id: string;
  accountId: string;
  name: string;
  email: string;
  phone: string;
  venueId: string;
  role: StaffRole;
  status: MembershipStatus;
  requestedAt: number;
  decidedByAccountId?: string;
}

/** A venue awaiting My VIP Clubs (platform admin) vetting before going live. */
export interface VenueRegistration {
  id: string;
  name: string;
  type: Venue['type'];
  address: string;
  neighborhood: string;
  city: string;
  ownerAccountId: string;
  ownerName: string;
  status: MembershipStatus;
  createdAt: number;
}
