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

/**
 * VIP preferences + recognition — mirrors the JotForm membership application
 * (Section 5 "Your VIP Preferences" and Section 6 "Member Profile & Recognition").
 * This is the data participating venues see so they can personalize service.
 */
export interface MemberPreferences {
  favoriteFoods: string; // Favorite foods / cuisines
  favoriteRestaurants: string; // Favorite restaurants or types of restaurants
  preferredBeverages: string; // Preferred beverages / cocktails
  dietaryRestrictions: string; // Dietary restrictions, food allergies, or sensitivities
  favoriteWineSpirits: string; // Favorite wine, spirits, beer, or non-alcoholic
  preferredSeating: string; // Preferred seating
  preferredAtmosphere: string; // Preferred atmosphere
  music: string; // Music / entertainment preferences
  smoking: string; // Smoking / cigar preferences
  specialOccasions: string; // Typical special occasions (checkbox list, joined)
  hospitalityDetails: string; // Any hospitality details a venue should know
  whatMakesVip: string; // What makes an experience feel truly VIP to you?
  doNotShare: string; // Details you do NOT want shared with venues
  additionalNotes: string; // Optional additional notes for recognition
  consentShareWithVenues: boolean; // Consent to share preferences with venues
}

/** Section 2 — Your Referral. */
export interface MemberReferral {
  firstName: string;
  lastName: string;
  vipNumber: string; // Referring Member's VIP Number
  relationship: string; // Your relationship to the referring member
  knownDuration: string; // How long you've known them
  knowsYouPersonally: boolean; // Does the referring member know you personally?
}

export interface PostalAddress {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postal: string;
}

export interface Member {
  id: string;
  // ----- Section 1: About You -----
  firstName: string; // Full Legal Name — first
  lastName: string; // Full Legal Name — last
  preferredName?: string; // Preferred Name / Nickname
  over21?: boolean; // Are you 21 or older?
  email: string;
  phone?: string; // NOTE: not on the JotForm yet — needed for SMS alerts
  homeAddress?: PostalAddress;
  linkedInUrl?: string;
  socialProfile?: string; // Instagram or other social
  relationshipStatus?: string;
  howHeard?: string; // How did you hear about MyVIPClubs?
  // ----- Section 2: Referral -----
  referral?: MemberReferral;
  // ----- Section 3: Professional -----
  employer?: string;
  industry?: string;
  jobTitle?: string;
  isBusinessOwner?: boolean;
  // ----- Section 4: Membership & Interests -----
  establishmentTypes?: string[]; // Upscale restaurants, Lounges, Nightlife, ...
  visitFrequency?: string;
  visitCompany?: string; // alone / couple / group
  interestedInEvents?: boolean;
  interestedInOffers?: boolean;
  // ----- Section 5 & 6: Preferences + recognition -----
  preferences: MemberPreferences;
  membershipPhotoUrl?: string; // membership-card photo
  // ----- App/derived -----
  memberSince: number; // year
  /** Level set by an admin (members.tier). Overrides the spend-based tier. */
  assignedTier?: TierId;
  photo: string; // emoji stand-in for avatar
  totalSpent: number;
  totalTips: number;
  visitsThisYear: number;
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
