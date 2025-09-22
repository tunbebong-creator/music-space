// server/app.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const indexRoutes = require('./routes/index');
const managerRoutes = require('./routes/manager');
const partnerRoutes = require('./routes/partners');
const { query } = require('./config/db'); // Postgres adapter

const app = express();

/* -------------------- Middlewares -------------------- */
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- Static files -------------------- */
// Uploads (ảnh cover, banner…)
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

// ✅ Serve toàn bộ file tĩnh từ GỐC repo (index.html, pages/, assets/, js/, ...)
app.use(express.static(path.resolve(__dirname, '..')));

/* -------------------- Health & Pings -------------------- */
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api/ping', (_req, res) => res.json({ pong: true }));

/* -------------------- API routes -------------------- */
app.use('/api', indexRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api', partnerRoutes);

// Bookings (POST /api/bookings, ...)
try {
  const bookingsRoutes = require('./routes/bookings');
  // Router trong bookings.js là router.post('/') => endpoint đầy đủ: /api/bookings
  app.use('/api/bookings', bookingsRoutes);
  console.log('✅ Mounted bookings routes under /api/bookings');
} catch (e) {
  console.log('ℹ️  bookings routes not found, skipping.');
}

/* -------------------- API 404 fallback -------------------- */
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

/* -------------------- Root route -------------------- */
// ✅ Bảo đảm truy cập "/" sẽ trả index.html ở gốc repo
app.get('/', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'index.html'));
});

/* -------------------- DB warm-up -------------------- */
(async () => {
  try {
    const r = await query('SELECT 1 AS ok', []);
    console.log('✅ DB connected (warm-up ok)', r.rows?.[0]);
  } catch (err) {
    console.error('❌ DB warm-up failed:', err.message);
  }
})();

/* -------------------- Start server -------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
