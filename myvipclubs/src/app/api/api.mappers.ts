/**
 * Translate between the API's snake_case rows and the app's camelCase models.
 */
import { Member, MemberPreferences, TierId, Venue } from '../models';
import { ApiMemberRow, ApiVenueRow } from './api.models';

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const bool = (v: unknown): boolean => v === true || v === 1 || v === '1';
const blankToUndef = (s: string): string | undefined => (s ? s : undefined);

const VENUE_TYPES: Venue['type'][] = [
  'Nightclub',
  'Lounge',
  'Rooftop',
  'Restaurant',
  'Speakeasy',
  'Members Club',
];
const TIERS: TierId[] = ['silver', 'gold', 'platinum', 'black', 'noir'];

/** members-table row -> app Member. */
export function toMember(r: ApiMemberRow): Member {
  const preferences: MemberPreferences = {
    favoriteFoods: str(r.favorite_foods),
    favoriteRestaurants: str(r.favorite_restaurants),
    preferredBeverages: str(r.preferred_beverages),
    dietaryRestrictions: str(r.dietary_restrictions),
    favoriteWineSpirits: str(r.favorite_wine_spirits),
    preferredSeating: str(r.preferred_seating),
    preferredAtmosphere: str(r.preferred_atmosphere),
    music: str(r.music),
    smoking: str(r.smoking),
    specialOccasions: str(r.special_occasions),
    hospitalityDetails: str(r.hospitality_details),
    whatMakesVip: str(r.what_makes_vip),
    doNotShare: str(r.do_not_share),
    additionalNotes: str(r.additional_notes),
    consentShareWithVenues: bool(r.consent_share_with_venues),
  };

  return {
    id: r.id,
    firstName: str(r.first_name),
    lastName: str(r.last_name),
    preferredName: blankToUndef(str(r.preferred_name)),
    email: str(r.email),
    phone: blankToUndef(str(r.phone)),
    linkedInUrl: blankToUndef(str(r.linkedin_url)),
    socialProfile: blankToUndef(str(r.social_profile)),
    preferences,
    memberSince: num(r.member_since) || new Date().getFullYear(),
    photo: '🕶️',
    totalSpent: num(r.total_spent),
    totalTips: num(r.total_tips),
    visitsThisYear: num(r.visits_this_year),
    favoriteVenueIds: [],
    favoriteStaffIds: [],
  };
}

/**
 * app preferences -> PATCH /members/me body (only server-editable columns).
 * NOTE: `special_occasions` is a JSON column in the DB, so we deliberately do
 * NOT send it here as free text (it would fail the JSON type). It still shows
 * on the profile for reading; a future update can store it as a proper list.
 */
export function prefsToPatch(p: MemberPreferences): Record<string, unknown> {
  return {
    favorite_foods: p.favoriteFoods,
    favorite_restaurants: p.favoriteRestaurants,
    preferred_beverages: p.preferredBeverages,
    dietary_restrictions: p.dietaryRestrictions,
    favorite_wine_spirits: p.favoriteWineSpirits,
    preferred_seating: p.preferredSeating,
    preferred_atmosphere: p.preferredAtmosphere,
    music: p.music,
    smoking: p.smoking,
    hospitality_details: p.hospitalityDetails,
    what_makes_vip: p.whatMakesVip,
    do_not_share: p.doNotShare,
    additional_notes: p.additionalNotes,
    consent_share_with_venues: p.consentShareWithVenues ? 1 : 0,
  };
}

/** venues-table row -> app Venue. */
export function toVenue(r: ApiVenueRow): Venue {
  const type = str(r.type) as Venue['type'];
  const tier = str(r.tier_required) as TierId;
  return {
    id: r.id,
    name: str(r.name),
    type: VENUE_TYPES.includes(type) ? type : 'Lounge',
    address: str(r.address),
    neighborhood: str(r.neighborhood),
    city: str(r.city),
    image: '🥂',
    vibe: 'On My VIP Clubs',
    memberTierRequired: TIERS.includes(tier) ? tier : 'silver',
    isMember: false,
    distanceMiles: 1,
    lat: num(r.lat),
    lng: num(r.lng),
    geofenceRadius: num(r.geofence_radius) || 250,
  };
}
