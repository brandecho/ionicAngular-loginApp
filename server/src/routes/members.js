const express = require('express');
const { query, one } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Columns a member may update on their own profile (Sections 5 & 6, plus contact).
const EDITABLE = [
  'preferred_name', 'phone', 'linkedin_url', 'social_profile',
  'favorite_foods', 'favorite_restaurants', 'preferred_beverages', 'dietary_restrictions',
  'favorite_wine_spirits', 'preferred_seating', 'preferred_atmosphere', 'music', 'smoking',
  'special_occasions', 'hospitality_details', 'what_makes_vip', 'do_not_share',
  'additional_notes', 'consent_share_with_venues',
];

/** GET /api/members/me */
router.get('/me', requireAuth, async (req, res) => {
  if (!req.auth.memberId) return res.status(404).json({ error: 'no member profile' });
  const member = await one('SELECT * FROM members WHERE id = :id', { id: req.auth.memberId });
  if (!member) return res.status(404).json({ error: 'not found' });
  res.json(member);
});

/** PATCH /api/members/me — update editable profile fields. */
router.patch('/me', requireAuth, async (req, res) => {
  if (!req.auth.memberId) return res.status(404).json({ error: 'no member profile' });
  const updates = {};
  for (const key of EDITABLE) {
    if (key in (req.body || {})) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'no editable fields' });

  const setSql = Object.keys(updates).map((k) => `${k} = :${k}`).join(', ');
  await query(`UPDATE members SET ${setSql} WHERE id = :id`, { ...updates, id: req.auth.memberId });
  const member = await one('SELECT * FROM members WHERE id = :id', { id: req.auth.memberId });
  res.json(member);
});

module.exports = router;
