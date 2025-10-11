const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('Missing DATABASE_URL');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false },
});

// warm-up & log lỗi rõ ràng
(async () => {
  try {
    await pool.query('select 1');
    console.log('✅ DB connected (Neon)');
  } catch (e) {
    console.error('❌ DB warm-up failed:', e.code, e.message);
  }
})();

module.exports = {
  pool,
  query: (text, params = []) => pool.query(text, params)
};
