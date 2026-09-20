/**
 * Shapes returned by the My VIP Clubs PHP API (api.myvipclubs.com).
 * These mirror the JSON the server sends. Database columns are snake_case;
 * the mappers in api.mappers.ts translate them to the app's camelCase models.
 */

export type ApiRole = 'member' | 'owner' | 'manager' | 'staff' | 'admin';

/** The public account object returned by /auth/login and /auth/register. */
export interface ApiAccount {
  id: string;
  role: ApiRole;
  name: string;
  email: string;
  phone: string | null;
  venueId: string | null;
  memberId: string | null;
}

export interface ApiAuthResponse {
  token: string;
  account: ApiAccount;
}

/** A row from the `members` table (only fields the app reads are named). */
export interface ApiMemberRow {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string | null;
  email: string;
  phone?: string | null;
  member_since?: number | string | null;
  application_status?: string | null;
  tier?: string | null;
  address_street1?: string | null;
  address_street2?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_postal?: string | null;
  relationship_status?: string | null;
  how_heard?: string | null;
  employer?: string | null;
  industry?: string | null;
  job_title?: string | null;
  total_spent?: string | number | null;
  total_tips?: string | number | null;
  visits_this_year?: number | null;
  linkedin_url?: string | null;
  social_profile?: string | null;
  membership_photo_url?: string | null;
  favorite_foods?: string | null;
  favorite_restaurants?: string | null;
  preferred_beverages?: string | null;
  dietary_restrictions?: string | null;
  favorite_wine_spirits?: string | null;
  preferred_seating?: string | null;
  preferred_atmosphere?: string | null;
  music?: string | null;
  smoking?: string | null;
  special_occasions?: string | null;
  hospitality_details?: string | null;
  what_makes_vip?: string | null;
  do_not_share?: string | null;
  additional_notes?: string | null;
  consent_share_with_venues?: number | boolean | null;
  [key: string]: unknown;
}

/** A row from the `venues` table. */
export interface ApiVenueRow {
  id: string;
  name: string;
  type?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  lat?: string | number | null;
  lng?: string | number | null;
  geofence_radius?: number | null;
  tier_required?: string | null;
  status?: string | null;
  [key: string]: unknown;
}
