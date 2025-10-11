// server/routes/index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

// CHỈ LẤY query, KHÔNG DÙNG sqlx NỮA
const { query } = require('../config/db');

/* ================== Mailer (dùng cho forgot/reset) ================== */
function mailer() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/** Tạo bảng password_resets nếu chưa có (Postgres) */
async function ensureResetTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id          BIGSERIAL PRIMARY KEY,
      user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token       TEXT   NOT NULL UNIQUE,
      expires_at  TIMESTAMPTZ NOT NULL,
      used_at     TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/* ================= AUTH ================= */

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  const { email, password, fullName, phone } = req.body || {};
  const e = (email || '').trim().toLowerCase();
  const p = (password || '').toString();

  if (!e || !p) return res.status(400).json({ error: 'missing_email_or_password' });

  try {
    // Check email tồn tại
    const rCheck = await query(
      'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
      [e]
    );
    if (rCheck.rows.length) return res.status(409).json({ error: 'email_exists' });

    const hash = await bcrypt.hash(p, 10);

    // Insert user
    const u = await query(
      `INSERT INTO users (email, password_hash, role, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id`,
      [e, hash, 'customer']
    );
    const userId = u.rows[0].id;

    // Insert hoặc update customer theo email
    await query(
      `INSERT INTO customers (user_id, email, full_name, phone, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (email) DO UPDATE
         SET full_name = COALESCE(EXCLUDED.full_name, customers.full_name),
             phone     = COALESCE(EXCLUDED.phone, customers.phone)`,
      [userId, e, fullName || null, phone || null]
    );

    return res.json({ ok: true, userId });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    const rs = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, c.full_name
       FROM users u
       LEFT JOIN customers c ON c.user_id = u.id
       WHERE u.email = $1
       LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );
    if (!rs.rows.length) return res.status(404).json({ error: 'user_not_found' });

    const row = rs.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash).catch(() => false);
    if (!ok) return res.status(401).json({ error: 'wrong_password' });

    res.json({ id: row.id, email: row.email, role: row.role, fullName: row.full_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

/* ---------- Forgot / Reset password ---------- */
// POST /api/auth/forgot
router.post('/auth/forgot', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'missing_email' });

    await ensureResetTable();

    const u = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    if (u.rows.length) {
      const userId = u.rows[0].id;
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await query(
        `INSERT INTO password_resets (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [userId, token, expiresAt]
      );

      // Lấy từ ENV để gửi mail đúng domain
      const base = process.env.APP_BASE_URL || 'http://localhost:3000';
      const link = `${base}/pages/reset-password.html?token=${encodeURIComponent(token)}`;

      await mailer().sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: email,
        subject: 'Đặt lại mật khẩu • Music Space',
        html: `<p>Nhấn vào liên kết để đặt lại mật khẩu (hết hạn sau 30 phút):</p>
               <p><a href="${link}">${link}</a></p>`,
      });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('forgot error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

// GET /api/auth/reset/:token
router.get('/auth/reset/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '');
    await ensureResetTable();

    const r = await query(
      `SELECT user_id, expires_at, used_at
       FROM password_resets
       WHERE token = $1
       LIMIT 1`,
      [token]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'invalid_token' });

    const row = r.rows[0];
    if (row.used_at) return res.status(400).json({ error: 'token_used' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'token_expired' });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

// POST /api/auth/reset
router.post('/auth/reset', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'missing_fields' });

    await ensureResetTable();

    const r = await query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_resets
       WHERE token = $1
       LIMIT 1`,
      [token]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'invalid_token' });

    const pr = r.rows[0];
    if (pr.used_at) return res.status(400).json({ error: 'token_used' });
    if (new Date(pr.expires_at) < new Date()) return res.status(400).json({ error: 'token_expired' });

    const hash = await bcrypt.hash(String(password), 10);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hash, pr.user_id]
    );
    await query(
      'UPDATE password_resets SET used_at = NOW() WHERE id = $1',
      [pr.id]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error('reset error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

/* ============== HEALING EVENTS (MAP) ============== */
// GET /api/healing-events
router.get('/healing-events', async (req, res) => {
  try {
    const { bbox = '', city = '', category = '', q = '' } = req.query;

    // tham số tìm kiếm (NULL nếu không dùng)
    const pSearch = q ? `%${q}%` : null;
    const pCity = city ? `%${city}%` : null;
    const pCategory = category ? `%${category}%` : null;

    // bbox: minLng,minLat,maxLng,maxLat (NULL nếu không hợp lệ)
    let minLng = null, minLat = null, maxLng = null, maxLat = null;
    if (bbox) {
      const parts = String(bbox).split(',').map(v => parseFloat(v.trim()));
      if (parts.length === 4 && parts.every(Number.isFinite)) {
        [minLng, minLat, maxLng, maxLat] = parts;
      }
    }

    const sql = `
      SELECT id, slug, title, category, city,
             venue_name, venue_address, lat, lng,
             start_time, end_time, price_cents, currency, thumbnail_url
      FROM events
      WHERE published = true
        AND ($1::text IS NULL OR (title ILIKE $1 OR venue_name ILIKE $1 OR city ILIKE $1))
        AND ($2::text IS NULL OR city ILIKE $2)
        AND ($3::text IS NULL OR category ILIKE $3)
        AND (
          $4::float8 IS NULL OR $5::float8 IS NULL OR $6::float8 IS NULL OR $7::float8 IS NULL
          OR (lat BETWEEN $5 AND $7 AND lng BETWEEN $4 AND $6)
        )
      ORDER BY COALESCE(start_time, created_at) DESC
    `;
    const params = [pSearch, pCity, pCategory, minLng, minLat, maxLng, maxLat];
    const r = await query(sql, params);
    res.json(r.rows || []);
  } catch (err) {
    console.error('healing-events error:', err);
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

/* ============== PING DB (test) ============== */
router.get('/ping-db', async (_req, res) => {
  try {
    const r = await query('SELECT 1 AS ok', []);
    res.json({ ok: r.rows[0].ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/events/:slug
router.get('/events/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    if (!slug) return res.status(400).json({ error: 'missing_slug' });

    const r = await query(
      `SELECT id, slug, title, category, city, venue_name, venue_address,
              start_time, end_time, capacity, price_cents, currency,
              description, benefits, requirements,
              thumbnail_url, banner_url, lat, lng
       FROM events
       WHERE lower(slug) = lower($1)
       LIMIT 1`,
      [slug]
    );

    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
    return res.json(r.rows[0]);
  } catch (err) {
    console.error('Get event detail error:', err);
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

module.exports = router;
