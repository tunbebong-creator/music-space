// server/config/db.js
const sql = require('mssql');

const cfg = {
  server: process.env.DB_HOST || 'localhost',      // ví dụ: 127.0.0.1
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'mspace',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '123456',
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: { max: 10, min: 1, idleTimeoutMillis: 30000 },
  connectionTimeout: 5000, // 5s
  requestTimeout: 10000    // 10s
};

let poolPromise = null;

async function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(cfg);
    poolPromise.then(() => console.log('✅ DB connected (port mode)'))
               .catch(err => {
                 console.error('❌ DB connect error:', err.message);
                 poolPromise = null; // cho phép retry ở request sau
               });
  }
  return poolPromise;
}

module.exports = { sql, getPool };
