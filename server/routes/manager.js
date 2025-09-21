// server/routes/manager.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const router = express.Router();

const { sql, getPool } = require('../config/db');
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

      const pool = await getPool();
      const q = `
        INSERT INTO dbo.Events
          (Slug, Title, Category, City, VenueName, VenueAddress,
           StartTime, EndTime, Capacity, PriceCents, Currency,
           Description, Benefits, Requirements,
           ThumbnailUrl, BannerUrl, Lat, Lng, Published, CreatedAt)
        OUTPUT INSERTED.Id, INSERTED.Slug
        VALUES
          (@Slug, @Title, @Category, @City, @VenueName, @VenueAddress,
           @StartTime, @EndTime, @Capacity, @PriceCents, @Currency,
           @Description, @Benefits, @Requirements,
           @Thumb, @Banner, @Lat, @Lng, @Published, SYSUTCDATETIME())
      `;
      const r = await pool.request()
        .input('Slug', sql.VarChar(120), slug)
        .input('Title', sql.NVarChar(255), title)
        .input('Category', sql.NVarChar(100), category || null)
        .input('City', sql.NVarChar(100), city || null)
        .input('VenueName', sql.NVarChar(255), venueName || null)
        .input('VenueAddress', sql.NVarChar(255), venueAddress || null)
        .input('StartTime', sql.DateTime2, startTime)
        .input('EndTime', sql.DateTime2, endTime)
        .input('Capacity', sql.Int, capacity)
        .input('PriceCents', sql.Int, priceCents)
        .input('Currency', sql.VarChar(10), currency || 'VND')
        .input('Description', sql.NVarChar(sql.MAX), description || null)
        .input('Benefits', sql.NVarChar(sql.MAX), benefits || null)
        .input('Requirements', sql.NVarChar(sql.MAX), requirements || null)
        .input('Thumb', sql.NVarChar(400), thumb ? `/uploads/${thumb}` : null)
        .input('Banner', sql.NVarChar(400), banner ? `/uploads/${banner}` : null)
        .input('Lat', sql.Decimal(9, 6), Number.isFinite(lat) ? lat : null)
        .input('Lng', sql.Decimal(9, 6), Number.isFinite(lng) ? lng : null)
        .input('Published', sql.Bit, 1)
        .query(q);

      const row = r.recordset?.[0];
      res.json({ ok: true, id: row?.Id, slug: row?.Slug });
    } catch (err) {
      console.error('Create event error:', err);
      res.status(500).json({ error: 'server_error', detail: err.message });
    }
  }
);

// Danh sách sự kiện (manager)
router.get('/events', async (_req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT Id, Slug, Title, City, VenueName,
             StartTime, EndTime, PriceCents, Currency, ThumbnailUrl
      FROM dbo.Events
      ORDER BY COALESCE(EndTime, StartTime) DESC
    `);
    res.json(r.recordset || []);
  } catch (e) {
    console.error('list events error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

/* KPIs + recent */
router.get('/kpi', async (_req, res) => {
  try {
    const p = await getPool();

    let evCount = 0, spCount = 0, usCount = 0;

    try {
      const r = await p.request().query(`SELECT COUNT(*) AS cnt FROM dbo.Events`);
      evCount = r.recordset[0]?.cnt ?? 0;
    } catch { }

    try {
      const r = await p.request().query(`SELECT COUNT(*) AS cnt FROM dbo.HealingSpaces`);
      spCount = r.recordset[0]?.cnt ?? 0;
    } catch {
      try {
        const r2 = await p.request().query(`SELECT COUNT(*) AS cnt FROM dbo.HealingSpace`);
        spCount = r2.recordset[0]?.cnt ?? 0;
      } catch { }
    }

    try {
      const r = await p.request().query(`SELECT COUNT(*) AS cnt FROM dbo.Users`);
      usCount = r.recordset[0]?.cnt ?? 0;
    } catch { }

    res.json({ events: evCount, spaces: spCount, users: usCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

// recent events — chỉ dùng CreatedAt để tránh lỗi UpdatedAt không tồn tại
router.get('/events/recent', async (_req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT TOP 10 Id, Slug, Title, City, StartTime
      FROM dbo.Events
      ORDER BY CreatedAt DESC
    `);
    res.json(r.recordset || []);
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
    const p = await getPool();
    let r;
    if (q) {
      r = await p.request()
        .input('q', sql.NVarChar(255), `%${q}%`)
        .query(`
          SELECT TOP 200 u.Id, u.Email, u.Role, u.CreatedAt, c.FullName
          FROM dbo.Users u
          LEFT JOIN dbo.Customers c ON c.UserId = u.Id
          WHERE u.Email LIKE @q OR ISNULL(c.FullName,'') LIKE @q
          ORDER BY u.CreatedAt DESC
        `);
    } else {
      r = await p.request().query(`
        SELECT TOP 200 u.Id, u.Email, u.Role, u.CreatedAt, c.FullName
        FROM dbo.Users u
        LEFT JOIN dbo.Customers c ON c.UserId = u.Id
        ORDER BY u.CreatedAt DESC
      `);
    }
    res.json(r.recordset || []);
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
    const p = await getPool();
    await p.request()
      .input('id', sql.BigInt, id)
      .input('role', sql.VarChar(20), role.toLowerCase())
      .query(`UPDATE dbo.Users SET Role=@role WHERE Id=@id`);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

/* ============================================================
   BOOKINGS (vé)
============================================================ */
// LIST BOOKINGS — loại bỏ mọi tham chiếu SentAt (để chắc chắn không lỗi)
router.get('/bookings', async (_req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query(`
      SELECT b.Id, b.Code, b.Quantity, b.AmountCents, b.Method, b.Status, b.CreatedAt,
             b.CustomerName, b.CustomerEmail, b.CustomerPhone,
             e.Id AS EventId, e.Title AS EventTitle, e.Slug, e.StartTime, e.Currency
      FROM dbo.EventBookings b
      JOIN dbo.Events e ON e.Id = b.EventId
      ORDER BY b.CreatedAt DESC
    `);
    res.json(r.recordset || []);
  } catch (e) {
    console.error('list bookings error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

// UPDATE STATUS (confirm / cancel / checked_in) — chỉ 1 route, dùng dynamic SQL an toàn
// PATCH /api/manager/bookings/:id  { status: 'pending'|'confirmed'|'cancelled'|'checked_in' }
router.patch('/bookings/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = (req.body?.status || '').toLowerCase();
    const allow = ['pending', 'confirmed', 'cancelled', 'checked_in'];
    if (!allow.includes(status)) return res.status(400).json({ error: 'invalid_status' });

    const p = await getPool();

    const has = await p.request().query(`
      SELECT CASE WHEN COL_LENGTH('dbo.EventBookings','UpdatedAt') IS NOT NULL THEN 1 ELSE 0 END AS HasCol
    `);
    const hasUpdatedAt = has.recordset?.[0]?.HasCol === 1;

    if (hasUpdatedAt) {
      await p.request()
        .input('Id', sql.BigInt, id)
        .input('Status', sql.VarChar(30), status)
        .query(`UPDATE dbo.EventBookings SET Status=@Status, UpdatedAt=SYSUTCDATETIME() WHERE Id=@Id`);
    } else {
      await p.request()
        .input('Id', sql.BigInt, id)
        .input('Status', sql.VarChar(30), status)
        .query(`UPDATE dbo.EventBookings SET Status=@Status WHERE Id=@Id`);
    }

    const r2 = await p.request()
      .input('Id', sql.BigInt, id)
      .query(`
        SELECT TOP 1 b.*, e.Title AS EventTitle, e.Slug, e.StartTime, e.Currency
        FROM dbo.EventBookings b
        JOIN dbo.Events e ON e.Id = b.EventId
        WHERE b.Id = @Id
      `);

    if (!r2.recordset.length) return res.status(404).json({ error: 'not_found' });
    return res.json({ ok: true, booking: r2.recordset[0] });
  } catch (e) {
    console.error('update status error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});


/* ============================================================
   BOOKINGS (vé) – phần mailer
============================================================ */
function mailer() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      minVersion: "TLSv1.2"
    }
  });
}


function ticketHtml(b) {
  const amount = (Number(b.AmountCents || 0) / 100).toLocaleString('vi-VN') + ' ' + (b.Currency || 'VND');
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:auto">
    <h2>🎟️ Vé giữ chỗ – ${b.EventTitle || 'Sự kiện'}</h2>
    <p>Xin chào <b>${b.CustomerName || ''}</b>,</p>
    <p>Bạn đã giữ chỗ thành công. Vui lòng thanh toán tại sự kiện.</p>
    <table style="border-collapse:collapse">
      <tr><td style="padding:6px 8px">Mã vé</td><td style="padding:6px 8px"><b>${b.Code}</b></td></tr>
      <tr><td style="padding:6px 8px">Sự kiện</td><td style="padding:6px 8px">${b.EventTitle || ''}</td></tr>
      <tr><td style="padding:6px 8px">Số lượng</td><td style="padding:6px 8px">${b.Quantity}</td></tr>
      <tr><td style="padding:6px 8px">Giá trị</td><td style="padding:6px 8px">${amount}</td></tr>
      <tr><td style="padding:6px 8px">PTTT</td><td style="padding:6px 8px">${(b.Method || 'cash').toUpperCase()}</td></tr>
      <tr><td style="padding:6px 8px">Trạng thái</td><td style="padding:6px 8px">${b.Status}</td></tr>
    </table>
    <p style="margin-top:18px">Cảm ơn bạn đã đồng hành cùng Music Space 💚</p>
  </div>`;
}

// ---- SEND TICKET (email) ----
router.post('/bookings/:id/send-ticket', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const p = await getPool();

    const r = await p.request()
      .input('Id', sql.BigInt, id)
      .query(`
        SELECT TOP 1 b.*, e.Title AS EventTitle, e.Currency
        FROM dbo.EventBookings b
        JOIN dbo.Events e ON e.Id = b.EventId
        WHERE b.Id = @Id
      `);

    if (!r.recordset.length) return res.status(404).json({ error: 'not_found' });

    const b = r.recordset[0];
    if (!b.CustomerEmail) return res.status(400).json({ error: 'no_email' });

    const transporter = mailer();
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: b.CustomerEmail,
      subject: `Vé giữ chỗ • ${b.EventTitle || 'Music Space'}`,
      html: ticketHtml(b),
    });

    // update SentAt nếu có cột
    await p.request()
      .input('Id', sql.BigInt, id)
      .query(`
        IF COL_LENGTH('dbo.EventBookings','SentAt') IS NOT NULL
          UPDATE dbo.EventBookings SET SentAt = SYSUTCDATETIME() WHERE Id=@Id;
      `);

    res.json({ ok: true });
  } catch (e) {
    console.error('✉️ send ticket error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});


/* ============================================================ */
module.exports = router;



