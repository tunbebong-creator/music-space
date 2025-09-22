// server/routes/manager.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const router = express.Router();

const { query, sqlx } = require('../config/db'); // <-- Postgres adapter
const { requireAuth, requireRole } = require('../middleware/auth');

/* ----------------------- UPLOAD CONFIG ----------------------- */
const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

/* ----------------------- HELPERS ----------------------- */
const toInt = (v, d = null) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const parseDate = v => { if (!v) return null; const d = new Date(v); return isNaN(d) ? null : d; };
const slugify = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

function parseMapsUrl(mapsUrl) {
  try {
    if (!mapsUrl) return {};
    const m = mapsUrl.match(/@(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
    if (m) return { lat: Number(m[1]), lng: Number(m[3]) };
    const u = new URL(mapsUrl);
    const q = u.searchParams.get('q');
    if (q) {
      const p = q.split(',').map(Number);
      if (p.length >= 2 && p.every(Number.isFinite)) return { lat: p[0], lng: p[1] };
    }
  } catch (_) { }
  return {};
}

/* ----------------------- AUTH GUARD ----------------------- */
router.use(requireAuth, requireRole(['manager', 'admin']));

/* ============================================================
   EVENTS
============================================================ */
router.post(
  '/events',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'banner', maxCount: 1 }]),
  async (req, res) => {
    try {
      const b = req.body || {};
      const title = (b.title || b.Title || '').toString().trim();
      if (!title) return res.status(400).json({ error: 'missing_title' });

      const category = (b.category || '').toString().trim();
      const city = (b.city || '').toString().trim();
      const venueName = (b.venueName || '').toString().trim();
      const venueAddress = (b.venueAddress || '').toString().trim();

      const startTime = parseDate(b.startTime);
      const endTime = parseDate(b.endTime);
      if (!startTime) return res.status(400).json({ error: 'invalid_start' });

      const capacity = toInt(b.capacity, null);

      // PriceCents mặc định 0 để tránh NULL
      let priceCents = toInt(b.priceCents ?? b.PriceCents, 0);
      if (!Number.isFinite(priceCents)) priceCents = 0;

      const currency = (b.currency || 'VND').toString().trim();
      const description = (b.description || '').toString();
      const benefits = (b.benefits || '').toString();
      const requirements = (b.requirements || '').toString();

      // Lat/Lng: ưu tiên field ẩn, fallback parse từ URL
      let lat = b.Lat ? Number(b.Lat) : null;
      let lng = b.Lng ? Number(b.Lng) : null;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        const pos = parseMapsUrl(b.gmapsUrl || b.mapsUrl || '');
        lat = Number.isFinite(lat) ? lat : pos.lat;
        lng = Number.isFinite(lng) ? lng : pos.lng;
      }

      const thumb = req.files?.thumbnail?.[0]?.filename || null;
      const banner = req.files?.banner?.[0]?.filename || null;

      const slug = slugify(title);

      const q = sqlx`
        INSERT INTO events
          (slug, title, category, city, venue_name, venue_address,
           start_time, end_time, capacity, price_cents, currency,
           description, benefits, requirements,
           thumbnail_url, banner_url, lat, lng, published, created_at)
        VALUES
          (${slug}, ${title}, ${category || null}, ${city || null}, ${venueName || null}, ${venueAddress || null},
           ${startTime}, ${endTime}, ${capacity}, ${priceCents}, ${currency || 'VND'},
           ${description || null}, ${benefits || null}, ${requirements || null},
           ${thumb ? `/uploads/${thumb}` : null}, ${banner ? `/uploads/${banner}` : null},
           ${Number.isFinite(lat) ? lat : null}, ${Number.isFinite(lng) ? lng : null},
           ${true}, NOW())
        RETURNING id, slug
      `;
      const r = await query(q.text, q.values);
      const row = r.rows?.[0];
      res.json({ ok: true, id: row?.id, slug: row?.slug });
    } catch (err) {
      console.error('Create event error:', err);
      res.status(500).json({ error: 'server_error', detail: err.message });
    }
  }
);

// Danh sách sự kiện (manager)
router.get('/events', async (_req, res) => {
  try {
    const sql = `
      SELECT id, slug, title, city, venue_name,
             start_time, end_time, price_cents, currency, thumbnail_url
      FROM events
      ORDER BY COALESCE(end_time, start_time) DESC
    `;
    const r = await query(sql, []);
    res.json(r.rows || []);
  } catch (e) {
    console.error('list events error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

/* KPIs + recent */
router.get('/kpi', async (_req, res) => {
  try {
    let evCount = 0, spCount = 0, usCount = 0;

    try {
      const r = await query(`SELECT COUNT(*)::int AS cnt FROM events`, []);
      evCount = r.rows[0]?.cnt ?? 0;
    } catch {}

    try {
      const r = await query(`SELECT COUNT(*)::int AS cnt FROM healing_spaces`, []);
      spCount = r.rows[0]?.cnt ?? 0;
    } catch {}

    try {
      const r = await query(`SELECT COUNT(*)::int AS cnt FROM users`, []);
      usCount = r.rows[0]?.cnt ?? 0;
    } catch {}

    res.json({ events: evCount, spaces: spCount, users: usCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// recent events — dùng created_at
router.get('/events/recent', async (_req, res) => {
  try {
    const r = await query(`
      SELECT id, slug, title, city, start_time
      FROM events
      ORDER BY created_at DESC
      LIMIT 10
    `, []);
    res.json(r.rows || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

/* ============================================================
   USERS (optional)
============================================================ */
router.get('/users', async (req, res) => {
  try {
    const q = (req.query.search || '').toString().trim();
    if (q) {
      const stmt = sqlx`
        SELECT u.id, u.email, u.role, u.created_at, c.full_name
        FROM users u
        LEFT JOIN customers c ON c.user_id = u.id
        WHERE u.email ILIKE '%' || ${q} || '%' OR COALESCE(c.full_name,'') ILIKE '%' || ${q} || '%'
        ORDER BY u.created_at DESC
        LIMIT 200
      `;
      const r = await query(stmt.text, stmt.values);
      return res.json(r.rows || []);
    } else {
      const r = await query(`
        SELECT u.id, u.email, u.role, u.created_at, c.full_name
        FROM users u
        LEFT JOIN customers c ON c.user_id = u.id
        ORDER BY u.created_at DESC
        LIMIT 200
      `, []);
      return res.json(r.rows || []);
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { role } = req.body || {};
    const allow = ['customer', 'manager', 'admin'];
    if (!allow.includes((role || '').toLowerCase())) {
      return res.status(400).json({ error: 'invalid_role' });
    }
    const stmt = sqlx`UPDATE users SET role = ${role.toLowerCase()} WHERE id = ${id}`;
    await query(stmt.text, stmt.values);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

/* ============================================================
   BOOKINGS (vé)
============================================================ */
// LIST BOOKINGS
router.get('/bookings', async (_req, res) => {
  try {
    const sql = `
      SELECT b.id, b.code, b.quantity, b.amount_cents, b.method, b.status, b.created_at,
             b.customer_name, b.customer_email, b.customer_phone,
             e.id AS event_id, e.title AS event_title, e.slug, e.start_time, e.currency
      FROM event_bookings b
      JOIN events e ON e.id = b.event_id
      ORDER BY b.created_at DESC
    `;
    const r = await query(sql, []);
    res.json(r.rows || []);
  } catch (e) {
    console.error('list bookings error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// PATCH /api/manager/bookings/:id  { status: 'pending'|'confirmed'|'cancelled'|'checked_in' }
router.patch('/bookings/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = (req.body?.status || '').toLowerCase();
    const allow = ['pending', 'confirmed', 'cancelled', 'checked_in'];
    if (!allow.includes(status)) return res.status(400).json({ error: 'invalid_status' });

    // update + updated_at
    const qUpd = sqlx`UPDATE event_bookings SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
    await query(qUpd.text, qUpd.values);

    const qSel = sqlx`
      SELECT b.*, e.title AS event_title, e.slug, e.start_time, e.currency
      FROM event_bookings b
      JOIN events e ON e.id = b.event_id
      WHERE b.id = ${id}
      LIMIT 1
    `;
    const r2 = await query(qSel.text, qSel.values);
    if (!r2.rows.length) return res.status(404).json({ error: 'not_found' });
    return res.json({ ok: true, booking: r2.rows[0] });
  } catch (e) {
    console.error('update status error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

/* ============================================================
   BOOKINGS (vé) – phần mailer
============================================================ */
function mailer2() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { minVersion: 'TLSv1.2' }
  });
}

function ticketHtml(b) {
  const amount =
    (Number(b.amount_cents || 0) / 100).toLocaleString('vi-VN') + ' ' + (b.currency || 'VND');
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:auto">
    <h2>🎟️ Vé giữ chỗ – ${b.event_title || 'Sự kiện'}</h2>
    <p>Xin chào <b>${b.customer_name || ''}</b>,</p>
    <p>Bạn đã giữ chỗ thành công. Vui lòng thanh toán tại sự kiện.</p>
    <table style="border-collapse:collapse">
      <tr><td style="padding:6px 8px">Mã vé</td><td style="padding:6px 8px"><b>${b.code}</b></td></tr>
      <tr><td style="padding:6px 8px">Sự kiện</td><td style="padding:6px 8px">${b.event_title || ''}</td></tr>
      <tr><td style="padding:6px 8px">Số lượng</td><td style="padding:6px 8px">${b.quantity}</td></tr>
      <tr><td style="padding:6px 8px">Giá trị</td><td style="padding:6px 8px">${amount}</td></tr>
      <tr><td style="padding:6px 8px">PTTT</td><td style="padding:6px 8px">${(b.method || 'cash').toUpperCase()}</td></tr>
      <tr><td style="padding:6px 8px">Trạng thái</td><td style="padding:6px 8px">${b.status}</td></tr>
    </table>
    <p style="margin-top:18px">Cảm ơn bạn đã đồng hành cùng Music Space 💚</p>
  </div>`;
}

// ---- SEND TICKET (email) ----
router.post('/bookings/:id/send-ticket', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const qSel = sqlx`
      SELECT b.*, e.title AS event_title, e.currency
      FROM event_bookings b
      JOIN events e ON e.id = b.event_id
      WHERE b.id = ${id}
      LIMIT 1
    `;
    const r = await query(qSel.text, qSel.values);
    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });

    const b = r.rows[0];
    if (!b.customer_email) return res.status(400).json({ error: 'no_email' });

    const transporter = mailer2();
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: b.customer_email,
      subject: `Vé giữ chỗ • ${b.event_title || 'Music Space'}`,
      html: ticketHtml(b),
    });

    // update sent_at
    const qUpd = sqlx`UPDATE event_bookings SET sent_at = NOW() WHERE id = ${id}`;
    await query(qUpd.text, qUpd.values);

    res.json({ ok: true });
  } catch (e) {
    console.error('✉️ send ticket error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

/* ============================================================ */
module.exports = router;
