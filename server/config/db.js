// server/config/db.js
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn('⚠ DATABASE_URL is not set. Check your environment variables.');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // cần cho Neon / Render
});

// Query helper (dùng cho các câu query đơn lẻ)
async function query(text, params = []) {
  return pool.query(text, params);
}

// sqlx helper (template literal -> text + values: [$1, $2, ...])
function sqlx(strings, ...values) {
  let text = '';
  const vals = [];
  strings.forEach((s, i) => {
    text += s;
    if (i < values.length) {
      vals.push(values[i]);
      text += `$${vals.length}`;
    }
  });
  return { text, values: vals };
}

module.exports = { pool, query, sqlx };
