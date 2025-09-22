const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false } // Neon yêu cầu SSL
});

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

function sqlx(strings, ...values) {
  const text = strings
    .map((s, i) => s + (i < values.length ? `$${i + 1}` : ''))
    .join('');
  return { text, values };
}

pool.on('connect', () => console.log('✅ Connected to Neon Postgres'));
pool.on('error', (err) => console.error('❌ PG pool error:', err));

module.exports = { query, sqlx };
