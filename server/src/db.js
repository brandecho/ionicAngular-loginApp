const mysql = require('mysql2/promise');
const config = require('./config');

// A shared connection pool. mysql2 handles reconnection.
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  charset: 'utf8mb4',
});

/** Run a query and return rows. */
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params || {});
  return rows;
}

/** Convenience: first row or null. */
async function one(sql, params) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

module.exports = { pool, query, one };
