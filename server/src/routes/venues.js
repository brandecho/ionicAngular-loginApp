const express = require('express');
const { query, one } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendSms } = require('../services/twilio');

const router = express.Router();

/** GET /api/venues — active venues. */
router.get('/', async (_req, res) => {
  const rows = await query("SELECT * FROM venues WHERE status = 'active' ORDER BY name");
  res.json(rows);
});

/** GET /api/venues/:id */
router.get('/:id', async (req, res) => {
  const v = await one('SELECT * FROM venues WHERE id = :id', { id: req.params.id });
  if (!v) return res.status(404).json({ error: 'not found' });
  res.json(v);
});

/** POST /api/venues/:id/request — current member requests access. */
router.post('/:id/request', requireAuth, async (req, res) => {
  const memberId = req.auth.memberId;
  if (!memberId) return res.status(403).json({ error: 'members only' });
  const venue = await one('SELECT * FROM venues WHERE id = :id', { id: req.params.id });
  if (!venue) return res.status(404).json({ error: 'venue not found' });

  const exists = await one(
    'SELECT id FROM venue_requests WHERE member_id = :m AND venue_id = :v',
    { m: memberId, v: venue.id },
  );
  if (exists) return res.status(200).json({ ok: true, alreadyRequested: true });

  await query(
    `INSERT INTO venue_requests (member_id, venue_id, status, note)
     VALUES (:m, :v, 'requested', :note)`,
    { m: memberId, v: venue.id, note: (req.body && req.body.note) || null },
  );

  const member = await one('SELECT first_name, last_name FROM members WHERE id = :id', { id: memberId });
  // notify the venue (inbox) + text its admins
  await query(
    `INSERT INTO notifications (audience_kind, audience_id, type, title, body, deep_link)
     VALUES ('venue', :vid, 'access_request', :title, :body, :link)`,
    {
      vid: venue.id,
      title: 'New access request',
      body: `${member.first_name} ${member.last_name} wants access to ${venue.name}.`,
      link: `/venue-portal/${venue.id}`,
    },
  );
  const admins = await query(
    "SELECT phone FROM accounts WHERE venue_id = :v AND role IN ('owner','manager') AND phone IS NOT NULL",
    { v: venue.id },
  );
  for (const a of admins) {
    await sendSms(a.phone, `My VIP Clubs: ${member.first_name} ${member.last_name} requested access to ${venue.name}. Review in the venue portal.`, 'access_request');
  }

  res.status(201).json({ ok: true });
});

module.exports = router;
