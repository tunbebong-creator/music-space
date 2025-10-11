// server/app.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const indexRoutes = require('./routes/index');
const managerRoutes = require('./routes/manager');
const partnerRoutes = require('./routes/partners');
const { query } = require('./config/db');

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
// serve toàn bộ site tĩnh
app.use(express.static(path.resolve(__dirname, '..')));

// Health
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api/ping', (_req, res) => res.json({ pong: true }));

// API
app.use('/api', indexRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api', partnerRoutes);

// bookings
try {
  const bookingsRoutes = require('./routes/bookings');
  app.use('/api/bookings', bookingsRoutes);
  console.log('✅ Mounted bookings routes under /api/bookings');
} catch (e) {
  console.log('ℹ️  bookings routes not found, skipping.');
}

// API 404
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// Root -> index.html
app.get('/', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'index.html'));
});

// Warm-up DB (không blocking)
(async () => {
  try {
    const r = await query('SELECT 1 AS ok', []);
    console.log('✅ DB connected (warm-up ok)', r.rows?.[0]);
  } catch (err) {
    console.error('❌ DB warm-up failed:', err.message);
  }
})();

// ➜ Quan trọng: Khi chạy local (không phải trên Vercel) thì mới listen()
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
}

// Export để serverless function dùng
module.exports = app;
