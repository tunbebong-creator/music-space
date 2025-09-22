// server/routes/index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const { pool, query, sqlx } = require('../config/db'); // Postgres adapter

/* ================== Mailer (dùng cho forgot/reset) ================== */
function mailer() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
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

  let client;
  try {
    // Check trùng email trong users
    {
      const qCheck = sqlx`SELECT 1 FROM users WHERE email = ${e} LIMIT 1`;
      const rCheck = await query(qCheck.text, qCheck.values);
      if (rCheck.rows.length) return res.status(409).json({ error: 'email_exists' });
    }

    const hash = await bcrypt.hash(p, 10);

    // Transaction để tạo user + upsert customer an toàn mà KHÔNG cần UNIQUE constraint
    client = await pool.connect();
    await client.query('BEGIN');

    // 1) Tạo users
    const qUser = sqlx`
      INSERT INTO users (email, password_hash, role, created_at)
      VALUES (${e}, ${hash}, ${'customer'}, NOW())
      RETURNING id
    `;
    const u = await client.query(qUser.text, qUser.values);
    const userId = u.rows[0].id;

    // 2) Upsert customers theo chiến lược:
    //    - UPDATE theo user_id
    //    - nếu 0 rows → UPDATE theo email
    //    - nếu vẫn 0 → INSERT mới
    const full = fullName || null;
    const ph = phone || null;

    const updByUser = sqlx`
      UPDATE customers
      SET email = COALESCE(${e}, email),
          full_name = COALESCE(${full}, full_name),
          phone = COALESCE(${ph}, phone)
      WHERE user_id = ${userId}
    `;
    const r1 = await client.query(updByUser.text, updByUser.values);

    if (r1.rowCount === 0) {
      const updByEmail = sqlx`
        UPDATE customers
        SET user_id = COALESCE(user_id, ${userId}),
            full_name = COALESCE(${full}, full_name),
            phone = COALESCE(${ph}, phone)
        WHERE email = ${e}
      `;
      const r2 = await client.query(updByEmail.text, updByEmail.values);

      if (r2.rowCount === 0) {
        const insCust = sqlx`
          INSERT INTO customers (user_id, email, full_name, phone, created_at)
          VALUES (${userId}, ${e}, ${full}, ${ph}, NOW())
        `;
        await client.query(insCust.text, insCust.values);
      }
    }

    await client.query('COMMIT');
    return res.json({ ok: true, userId });
  } catch (err) {
    if (client) { try { await client.query('ROLLBACK'); } catch {} }
    console.error('register error:', err);
    return res.status(500).json({ error: 'server_error', detail: err.message });
  } finally {
    if (client) client.release();
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    const q = sqlx`
      SELECT u.id, u.email, u.password_hash, u.role, c.full_name
      FROM users u
      LEFT JOIN customers c ON c.user_id = u.id
      WHERE u.email = ${String(email).trim().toLowerCase()}
      LIMIT 1
    `;
    const rs = await query(q.text, q.values);
    if (!rs.rows.length) return res.status(404).json({ error: 'user_not_found' });

    const row = rs.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash).catch(() => false);
    if (!ok) return res.status(401).json({ error: 'wrong_password' });

    // 👇 Đây chính là chỗ trả dữ liệu về FE
    res.json({ id: row.id, email: row.email, role: row.role, fullName: row.full_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});


/* ---------- Forgot / Reset password ---------- */

// POST /api/auth/forgot  { email }
router.post('/auth/forgot', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'missing_email' });

    await ensureResetTable();

    const qU = sqlx`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    const u = await query(qU.text, qU.values);

    // Luôn trả ok; chỉ gửi mail khi user tồn tại
    if (u.rows.length) {
      const userId = u.rows[0].id;
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

      const qIns = sqlx`
        INSERT INTO password_resets (user_id, token, expires_at)
        VALUES (${userId}, ${token}, ${expiresAt})
      `;
      await query(qIns.text, qIns.values);

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

// GET /api/auth/reset/:token → kiểm tra token
router.get('/auth/reset/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '');
    await ensureResetTable();

    const q = sqlx`
      SELECT user_id, expires_at, used_at
      FROM password_resets
      WHERE token = ${token}
      LIMIT 1
    `;
    const r = await query(q.text, q.values);
    if (!r.rows.length) return res.status(404).json({ error: 'invalid_token' });

    const row = r.rows[0];
    if (row.used_at) return res.status(400).json({ error: 'token_used' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'token_expired' });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

// POST /api/auth/reset  { token, password }
router.post('/auth/reset', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'missing_fields' });

    await ensureResetTable();

    const qSel = sqlx`
      SELECT id, user_id, expires_at, used_at
      FROM password_resets
      WHERE token = ${token}
      LIMIT 1
    `;
    const r = await query(qSel.text, qSel.values);
    if (!r.rows.length) return res.status(404).json({ error: 'invalid_token' });

    const pr = r.rows[0];
    if (pr.used_at) return res.status(400).json({ error: 'token_used' });
    if (new Date(pr.expires_at) < new Date()) return res.status(400).json({ error: 'token_expired' });

    const hash = await bcrypt.hash(String(password), 10);

    // update password
    const qUpd = sqlx`UPDATE users SET password_hash = ${hash} WHERE id = ${pr.user_id}`;
    await query(qUpd.text, qUpd.values);

    // mark used
    const qUsed = sqlx`UPDATE password_resets SET used_at = NOW() WHERE id = ${pr.id}`;
    await query(qUsed.text, qUsed.values);

    res.json({ ok: true });
  } catch (e) {
    console.error('reset error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

/* ============== HEALING EVENTS (MAP) ============== */
router.get('/healing-events', async (req, res) => {
  try {
    const { bbox = '', city = '', category = '', q = '' } = req.query;

    const clauses = ['published = true'];
    const params = [];
    let i = 1;

    if (q) {
      clauses.push(`(title ILIKE '%' || $${i} || '%' OR venue_name ILIKE '%' || $${i} || '%' OR city ILIKE '%' || $${i} || '%')`);
      params.push(q);
      i++;
    }
    if (city) { clauses.push(`city = $${i++}`); params.push(city); }
    if (category) { clauses.push(`category = $${i++}`); params.push(category); }

    // bbox: minLng,minLat,maxLng,maxLat
    if (bbox) {
      const parts = bbox.split(',').map(parseFloat);
      if (parts.length === 4 && parts.every(n => !Number.isNaN(n))) {
        const [minLng, minLat, maxLng, maxLat] = parts;
        clauses.push(`lat BETWEEN $${i} AND $${i + 1}`); params.push(minLat, maxLat); i += 2;
        clauses.push(`lng BETWEEN $${i} AND $${i + 1}`); params.push(minLng, maxLng); i += 2;
      }
    }

    const sql = `
      SELECT id, slug, title, category, city,
             venue_name, venue_address, lat, lng,
             start_time, end_time, price_cents, currency, thumbnail_url
      FROM events
      WHERE ${clauses.join(' AND ')}
      ORDER BY start_time DESC
    `;

    const r = await query(sql, params);
    res.json(r.rows);
  } catch (err) {
    console.error(err);
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

// GET /api/events/:slug → chi tiết sự kiện
router.get('/events/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    if (!slug) return res.status(400).json({ error: 'missing_slug' });

    const q = sqlx`
      SELECT id, slug, title, category, city, venue_name, venue_address,
             start_time, end_time, capacity, price_cents, currency,
             description, benefits, requirements,
             thumbnail_url, banner_url, lat, lng
      FROM events
      WHERE slug = ${slug}
      LIMIT 1
    `;
    const r = await query(q.text, q.values);
    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
    return res.json(r.rows[0]);
  } catch (err) {
    console.error('Get event detail error:', err);
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

module.exports = router;
