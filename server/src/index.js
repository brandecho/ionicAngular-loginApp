const express = require('express');
const cors = require('cors');
const config = require('./config');
const { pool } = require('./db');

const app = express();

app.use(
  cors({
    origin: config.corsOrigin.length ? config.corsOrigin : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true })); // JotForm posts urlencoded

// health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'up' });
  } catch (e) {
    res.status(500).json({ ok: false, db: 'down', error: e.message });
  }
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/webhooks', require('./routes/jotform'));

// fallback error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'server error' });
});

app.listen(config.port, () => {
  console.log(`My VIP Clubs API listening on :${config.port}`);
});
