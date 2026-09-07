export type TierId = 'silver' | 'gold' | 'platinum' | 'black' | 'noir';

export interface Tier {
  id: TierId;
  name: string;
  /** Minimum lifetime spend (spend + tips) to reach this tier. */
  threshold: number;
  /** Accent color for the tier badge/card. */
  color: string;
  tagline: string;
  perks: string[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Bartender' | 'Server' | 'Event Manager' | 'Host' | 'Sommelier' | 'Security';
  venueId: string;
  venueName: string;
  avatar: string; // initials or emoji
  note?: string; // "knows my order", etc.
}

export interface Venue {
  id: string;
  name: string;
  type: 'Nightclub' | 'Lounge' | 'Rooftop' | 'Restaurant' | 'Speakeasy' | 'Members Club';
  /** Street address — geocoded to lat/lng via GeocodingService. */
  address: string;
  neighborhood: string;
  city: string;
  image: string; // emoji stand-in for artwork
  vibe: string;
  memberTierRequired: TierId;
  /** Whether the member currently has access at this venue. */
  isMember: boolean;
  /** Rough distance in miles for the check-in / nearby demo. */
  distanceMiles?: number;
  /** Geo-coordinates used to arm a native geofence around the venue. */
  lat: number;
  lng: number;
  /** Geofence trigger radius in meters (defaults applied if omitted). */
  geofenceRadius?: number;
}

export type RequestStatus = 'requested' | 'in_review' | 'approved' | 'declined';

export interface VenueRequest {
  memberId: string;
  venueId: string;
  status: RequestStatus;
  requestedAt: number;
  /** Optional note the member adds when requesting the hookup. */
  note?: string;
}

export interface MemberPreferences {
  favoriteDrink: string;
  secondDrink: string;
  spirit: string;
  seating: string;
  music: string;
  allergies: string;
  celebration: string;
  notes: string;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberSince: number; // year
  photo: string; // emoji stand-in
  totalSpent: number;
  totalTips: number;
  visitsThisYear: number;
  preferences: MemberPreferences;
  favoriteVenueIds: string[];
  favoriteStaffIds: string[];
  /** Set when the member is currently inbound to a venue (venue-side "tonight"). */
  arriving?: { venueId: string; etaMinutes: number };
}

export interface CheckInEvent {
  id: string;
  venueId: string;
  venueName: string;
  at: number; // timestamp
  status: 'arriving' | 'notified' | 'welcomed';
}

/** What a venue manager sees when they open the recognition push. */
export interface ManagerAlert {
  memberId: string;
  venueId: string;
  venueName: string;
  distanceMiles: number;
  etaMinutes: number;
  at: number;
}
