const express = require('express');
const { query, one } = require('../db');
const config = require('../config');

const router = express.Router();

/**
 * POST /api/webhooks/jotform
 * JotForm posts each submission here. It sends a `rawRequest` field (JSON of all
 * answers keyed like "q5_fullLegal"). We strip the "q<n>_" prefix and map by the
 * field's internal name (fullLegal, emailAddress, favoriteFoods, ...) — the same
 * names in docs/MyVIPClubs_JotForm_Fields.docx.
 *
 * NOTE: verify the exact keys against your first real submission and adjust if
 * JotForm renamed anything; the name-suffix matching below is resilient to the
 * changing q<n> numbers.
 */
router.post('/jotform', async (req, res) => {
  // optional shared-secret check
  if (config.jotformWebhookToken) {
    const t = req.query.token || req.headers['x-webhook-token'];
    if (t !== config.jotformWebhookToken) return res.status(401).json({ error: 'bad token' });
  }

  let raw = req.body || {};
  if (typeof raw.rawRequest === 'string') {
    try { raw = JSON.parse(raw.rawRequest); } catch { /* keep raw */ }
  }
  const f = normalize(raw);

  const name = f.fullLegal || {};
  const addr = f.homeAddress || {};
  const referralName = f.referringMembers && typeof f.referringMembers === 'object' ? f.referringMembers : {};

  const member = {
    first_name: str(name.first) || 'Unknown',
    last_name: str(name.last) || '',
    preferred_name: str(f.preferredName),
    over_21: yesNo(f.areYou),
    email: str(f.emailAddress) || '',
    phone: str(f.phone || f.mobile || f.cellPhone), // add a Mobile field to the form
    address_street1: str(addr.addr_line1),
    address_street2: str(addr.addr_line2),
    address_city: str(addr.city),
    address_state: str(addr.state),
    address_postal: str(addr.postal),
    linkedin_url: str(f.linkedinProfile),
    social_profile: str(f.instagramOr),
    relationship_status: str(f.relationshipStatus),
    how_heard: str(f.howDid),
    referral_first: str(referralName.first),
    referral_last: str(referralName.last),
    referral_vip_number: str(typeof f.referringMembers === 'string' ? f.referringMembers : f.referringMembersVip),
    referral_relationship: str(f.yourRelationship),
    referral_known_duration: str(f.howLong),
    referral_knows_personally: yesNo(f.doesThe),
    employer: str(f.currentEmployer),
    industry: str(f.industry),
    job_title: str(f.jobTitle),
    is_business_owner: yesNo(f.areYou43),
    establishment_types: jsonArr(f.whatTypes),
    visit_frequency: str(f.howOften),
    visit_company: str(f.doYou),
    interested_events: yesNo(f.areYou54),
    interested_offers: yesNo(f.areYou55),
    favorite_foods: str(f.favoriteFoods),
    favorite_restaurants: str(f.favoriteRestaurants),
    preferred_beverages: str(f.preferredBeverages),
    dietary_restrictions: str(f.dietaryRestrictions),
    favorite_wine_spirits: str(f.favoriteWine),
    preferred_seating: str(f.preferredSeating),
    preferred_atmosphere: str(f.preferredAtmosphere),
    music: str(f.music),
    smoking: str(f.smoking),
    special_occasions: jsonArr(f.typicalSpecial),
    hospitality_details: str(f.anyHospitality),
    what_makes_vip: str(f.whatMakes),
    do_not_share: str(f.areThere),
    additional_notes: str(f.optionalAdditional),
    consent_share_with_venues: yesNo(f.doYou70),
    standards_ack: hasAll(f.pleaseAcknowledge),
    gratuity_agreed: /agree/i.test(str(f.iUnderstand) || '') && !/not/i.test(str(f.iUnderstand) || ''),
    privacy_consented: hasAll(f.pleaseAcknowledge81),
    authorize_verification: yesNo(f.iAuthorize),
    final_certification: hasAll(f.finalCertification),
  };

  const id = (await one('SELECT UUID() AS id')).id;
  const cols = Object.keys(member);
  const sql =
    `INSERT INTO members (id, application_status, ${cols.join(', ')}) ` +
    `VALUES (:id, 'pending', ${cols.map((c) => ':' + c).join(', ')})`;
  await query(sql, { id, ...member });

  // notify platform admin (inbox)
  await query(
    `INSERT INTO notifications (audience_kind, audience_id, type, title, body, deep_link)
     VALUES ('role', 'admin', 'application_received', :title, :body, '/admin')`,
    {
      title: 'New membership application',
      body: `${member.first_name} ${member.last_name} applied. Referral: ${member.referral_first || '—'}.`,
    },
  );

  res.json({ ok: true, memberId: id });
});

// ---------- helpers ----------
function normalize(raw) {
  const out = {};
  for (const k of Object.keys(raw || {})) {
    const m = k.match(/^q\d+_(.+)$/);
    out[m ? m[1] : k] = raw[k];
  }
  return out;
}
function str(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.join(', ');
  const s = String(v).trim();
  return s === '' ? null : s;
}
function yesNo(v) {
  const s = (str(v) || '').toLowerCase();
  if (!s) return null;
  return s.startsWith('y') || s === 'i agree' ? 1 : 0;
}
function jsonArr(v) {
  if (v == null) return null;
  const arr = Array.isArray(v) ? v : typeof v === 'object' ? Object.values(v) : [v];
  const clean = arr.map((x) => String(x).trim()).filter(Boolean);
  return clean.length ? JSON.stringify(clean) : null;
}
function hasAll(v) {
  // checkbox acknowledgment groups — treat "some values present" as acknowledged
  const a = jsonArr(v);
  return a ? 1 : 0;
}

module.exports = router;
