/**
 * Applies schema.sql to the configured database.
 * Usage: npm run migrate
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('./config');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
  });
  try {
    await conn.query(sql);
    console.log('Schema applied to', config.db.database);
  } finally {
    await conn.end();
  }
})().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
