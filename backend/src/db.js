const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
});

// Warm up the connection on startup
pool.query('SELECT 1').catch(() => {});

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};