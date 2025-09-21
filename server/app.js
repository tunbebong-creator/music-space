// server/app.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const indexRoutes   = require('./routes/index');
const managerRoutes = require('./routes/manager');  

const app = express();

// -------- Middlewares --------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------- Static --------
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
app.use(express.static(path.resolve(__dirname, '..'))); // <— sửa 'stati' thành 'static'

// -------- API --------
app.use('/api', indexRoutes);
app.use('/api/manager', managerRoutes);

const partnerRoutes = require('./routes/partners');
app.use('/api', partnerRoutes);


// Mount bookings (nếu tồn tại). Mount tại /api để có cả
// /api/bookings/* và /api/manager/bookings
try {
  const bookingsRoutes = require('./routes/bookings');
  app.use('/api', bookingsRoutes);
  console.log('✅ Mounted bookings routes under /api');
} catch (e) {
  console.log('ℹ️  bookings routes not found, skipping.');
}

// 404 cho /api/*
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// -------- DB warm-up --------
const { getPool } = require('./config/db');
(async () => {
  try {
    const p = await getPool();
    await p.request().query('SELECT 1 AS ok');
    console.log('✅ DB connected (warm-up ok)');
  } catch (err) {
    console.error('❌ DB warm-up failed:', err.message);
  }
})();

// -------- Start --------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));


