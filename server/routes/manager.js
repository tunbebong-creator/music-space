// server/routes/manager.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const router = express.Router();

const { query, sqlx } = require('../config/db'); // Postgres adapter

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
const toInt = (v, d = null) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};
const parseDate = v => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d;
};
const slugify = s =>
  String(s || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

/* ============================================================
   EVENTS
============================================================ */
router.post(
  '/events',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'banner', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const b = req.body || {};
      const title = (b.title || '').trim();
      if (!title) return res.status(400).json({ error: 'missing_title' });

      const slug = slugify(title);
      const startTime = parseDate(b.startTime);
      if (!startTime) return res.status(400).json({ error: 'invalid_start' });
      const endTime = parseDate(b.endTime);

      const q = sqlx`
        INSERT INTO events
          (slug, title, category, city, venue_name, venue_address,
           start_time, end_time, capacity, price_cents, currency,
           description, benefits, requirements,
           thumbnail_url, banner_url, lat, lng, published, created_at)
        VALUES
          (${slug}, ${title}, ${b.category || null}, ${b.city || null},
           ${b.venueName || null}, ${b.venueAddress || null},
           ${startTime}, ${endTime}, ${toInt(b.capacity)},
           ${toInt(b.priceCents, 0)}, ${b.currency || 'VND'},
           ${b.description || null}, ${b.benefits || null}, ${b.requirements || null},
           ${req.files?.thumbnail?.[0]?.filename ? '/uploads/' + req.files.thumbnail[0].filename : null},
           ${req.files?.banner?.[0]?.filename ? '/uploads/' + req.files.banner[0].filename : null},
           ${b.lat || null}, ${b.lng || null},
           ${true}, NOW())
        RETURNING id, slug
      `;
      const r = await query(q.text, q.values);
      res.json({ ok: true, id: r.rows[0].id, slug: r.rows[0].slug });
    } catch (err) {
      console.error('Create event error:', err);
      res.status(500).json({ error: 'server_error', detail: err.message });
    }
  }
);

router.get('/events', async (_req, res) => {
  try {
    const r = await query(
      `SELECT id, slug, title, city, venue_name,
              start_time, end_time, price_cents, currency, thumbnail_url
         FROM events
        ORDER BY COALESCE(end_time, start_time) DESC`,
      []
    );
    res.json(r.rows);
  } catch (e) {
    console.error('list events error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/events/recent', async (_req, res) => {
  try {
    const r = await query(
      `SELECT id, slug, title, city, start_time
         FROM events
        ORDER BY created_at DESC
        LIMIT 10`,
      []
    );
    res.json(r.rows);
  } catch (e) {
    console.error('recent events error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

/* ============================================================
   KPI
============================================================ */
router.get('/kpi', async (_req, res) => {
  try {
    const [ev, sp, us] = await Promise.all([
      query('SELECT COUNT(*)::int AS cnt FROM events'),
      query('SELECT COUNT(*)::int AS cnt FROM healing_spaces').catch(() => ({ rows: [{ cnt: 0 }] })),
      query('SELECT COUNT(*)::int AS cnt FROM users')
    ]);
    res.json({
      events: ev.rows[0].cnt,
      spaces: sp.rows[0].cnt,
      users: us.rows[0].cnt
    });
  } catch (e) {
    console.error('kpi error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

/* ============================================================
   USERS
============================================================ */
router.get('/users', async (req, res) => {
  try {
    const q = String(req.query.search || '').trim();
    let r;
    if (q) {
      const s = `%${q}%`;
      r = await query(
        `SELECT u.id, u.email, u.role, u.created_at, c.full_name
           FROM users u
           LEFT JOIN customers c ON c.user_id = u.id
          WHERE u.email ILIKE $1 OR COALESCE(c.full_name,'') ILIKE $1
          ORDER BY u.created_at DESC
          LIMIT 200`,
        [s]
      );
    } else {
      r = await query(
        `SELECT u.id, u.email, u.role, u.created_at, c.full_name
           FROM users u
           LEFT JOIN customers c ON c.user_id = u.id
          ORDER BY u.created_at DESC
          LIMIT 200`,
        []
      );
    }
    res.json(r.rows);
  } catch (e) {
    console.error('users list error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const role = String(req.body?.role || '').toLowerCase();
    if (!['customer', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'invalid_role' });
    }
    await query('UPDATE users SET role=$1 WHERE id=$2', [role, id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('update role error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

/* ============================================================
   BOOKINGS
============================================================ */
router.get('/bookings', async (_req, res) => {
  try {
    const r = await query(
      `SELECT b.id, b.code, b.quantity, b.amount_cents, b.method, b.status, b.created_at,
              b.customer_name, b.customer_email, b.customer_phone,
              e.id AS event_id, e.title AS event_title, e.slug, e.start_time, e.currency
         FROM event_bookings b
         JOIN events e ON e.id = b.event_id
        ORDER BY b.created_at DESC`,
      []
    );
    res.json(r.rows);
  } catch (e) {
    console.error('list bookings error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

router.patch('/bookings/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body?.status || '').toLowerCase();
    if (!['pending', 'confirmed', 'cancelled', 'checked_in'].includes(status)) {
      return res.status(400).json({ error: 'invalid_status' });
    }
    await query(
      'UPDATE event_bookings SET status=$1, updated_at=NOW() WHERE id=$2',
      [status, id]
    );
    const r = await query(
      `SELECT b.*, e.title AS event_title, e.slug, e.start_time, e.currency
         FROM event_bookings b
         JOIN events e ON e.id = b.event_id
        WHERE b.id=$1 LIMIT 1`,
      [id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true, booking: r.rows[0] });
  } catch (e) {
    console.error('update status error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

/* ============================================================
   BOOKINGS – SEND TICKET
============================================================ */
function mailer2() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: { minVersion: 'TLSv1.2' }
  });
}

function ticketHtml(b) {
  const amount =
    (Number(b.amount_cents || 0) / 100).toLocaleString('vi-VN') +
    ' ' +
    (b.currency || 'VND');
  return `
  <div style="font-family:sans-serif;max-width:560px;margin:auto">
    <h2>🎟️ Vé giữ chỗ – ${b.event_title || 'Sự kiện'}</h2>
    <p>Xin chào <b>${b.customer_name || ''}</b>,</p>
    <p>Bạn đã giữ chỗ thành công. Vui lòng thanh toán tại sự kiện.</p>
    <table>
      <tr><td>Mã vé</td><td><b>${b.code}</b></td></tr>
      <tr><td>Sự kiện</td><td>${b.event_title || ''}</td></tr>
      <tr><td>Số lượng</td><td>${b.quantity}</td></tr>
      <tr><td>Giá trị</td><td>${amount}</td></tr>
      <tr><td>PTTT</td><td>${(b.method || 'cash').toUpperCase()}</td></tr>
      <tr><td>Trạng thái</td><td>${b.status}</td></tr>
    </table>
  </div>`;
}

router.post('/bookings/:id/send-ticket', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await query(
      `SELECT b.*, e.title AS event_title, e.currency
         FROM event_bookings b
         JOIN events e ON e.id = b.event_id
        WHERE b.id=$1 LIMIT 1`,
      [id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });

    const b = r.rows[0];
    if (!b.customer_email) return res.status(400).json({ error: 'no_email' });

    await mailer2().sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: b.customer_email,
      subject: `Vé giữ chỗ • ${b.event_title}`,
      html: ticketHtml(b)
    });

    await query('UPDATE event_bookings SET sent_at=NOW() WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('send ticket error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
