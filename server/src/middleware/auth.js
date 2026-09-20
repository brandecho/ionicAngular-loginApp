const jwt = require('jsonwebtoken');
const config = require('../config');

/** Sign a session token for an account. */
function sign(account) {
  return jwt.sign(
    { sub: account.id, role: account.role, memberId: account.member_id, venueId: account.venue_id },
    config.jwtSecret,
    { expiresIn: config.jwtExpires },
  );
}

/** Express middleware — require a valid Bearer token. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    req.auth = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

/** Require one of the given roles (use after requireAuth). */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

module.exports = { sign, requireAuth, requireRole };
