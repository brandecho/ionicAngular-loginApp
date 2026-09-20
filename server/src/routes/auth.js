const express = require('express');
const bcrypt = require('bcryptjs');
const { query, one } = require('../db');
const { sign } = require('../middleware/auth');

const router = express.Router();

/** POST /api/auth/register — create a member account (+ empty member profile). */
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  const existing = await one('SELECT id FROM accounts WHERE email = :email', { email });
  if (existing) return res.status(409).json({ error: 'email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const [first, ...rest] = name.trim().split(' ');
  const last = rest.join(' ') || '';

  // create the member profile
  const memberId = (await one('SELECT UUID() AS id')).id;
  await query(
    `INSERT INTO members (id, first_name, last_name, email, phone, application_status)
     VALUES (:id, :first, :last, :email, :phone, 'pending')`,
    { id: memberId, first, last, email, phone: phone || null },
  );

  const accountId = (await one('SELECT UUID() AS id')).id;
  await query(
    `INSERT INTO accounts (id, role, name, email, phone, password_hash, member_id)
     VALUES (:id, 'member', :name, :email, :phone, :hash, :memberId)`,
    { id: accountId, name, email, phone: phone || null, hash, memberId },
  );

  const account = await one('SELECT * FROM accounts WHERE id = :id', { id: accountId });
  res.status(201).json({ token: sign(account), account: publicAccount(account) });
});

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const account = await one('SELECT * FROM accounts WHERE email = :email', { email });
  if (!account) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, account.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  res.json({ token: sign(account), account: publicAccount(account) });
});

function publicAccount(a) {
  return { id: a.id, role: a.role, name: a.name, email: a.email, phone: a.phone, venueId: a.venue_id, memberId: a.member_id };
}

module.exports = router;
