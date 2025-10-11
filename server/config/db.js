// server/config/db.js
const { Pool } = require('pg');

// DATABASE_URL trên Render (Neon) dạng: postgres://user:pass@host/db?sslmode=require
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString && !/sslmode=disable/.test(connectionString) ? { rejectUnauthorized: false } : undefined,
});

// helper query (dùng cho các route không cần transaction)
async function query(text, params = []) {
  const res = await pool.query(text, params);
  return res;
}

// helper tagged template -> thay thế $1, $2…
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