const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const indexRoutes = require('./routes/index');
const managerRoutes = require('./routes/manager');
const partnerRoutes = require('./routes/partners');

// ⬇️ Dùng adapter Postgres
const { query } = require('./config/db');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
app.use(express.static(path.resolve(__dirname, '..')));

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api/ping', (_req, res) => res.json({ pong: true }));

app.use('/api', indexRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api', partnerRoutes);

try {
  const bookingsRoutes = require('./routes/bookings');
  app.use('/api', bookingsRoutes);
  console.log('✅ Mounted bookings routes under /api');
} catch (e) {
  console.log('ℹ️  bookings routes not found, skipping.');
}

// 404 fallback
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// ⬇️ Warm-up: Postgres
(async () => {
  try {
    const r = await query('SELECT 1 AS ok', []);
    console.log('✅ DB connected (warm-up ok)', r.rows?.[0]);
  } catch (err) {
    console.error('❌ DB warm-up failed:', err.message);
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
