// server/routes/index.js
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const router = express.Router();
const { sql, getPool } = require('../config/db');

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
async function ensureResetTable(pool) {
  await pool.request().query(`
IF OBJECT_ID('dbo.PasswordResets','U') IS NULL
BEGIN
  CREATE TABLE dbo.PasswordResets (
    Id        BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserId    BIGINT        NOT NULL,
    Token     NVARCHAR(200) NOT NULL UNIQUE,
    ExpiresAt DATETIME2     NOT NULL,
    UsedAt    DATETIME2     NULL,
    CreatedAt DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
`);
}

/* ================= AUTH ================= */
// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  const { email, password, fullName, phone } = req.body || {};
  try {
    const e = (email || '').trim().toLowerCase();
    const p = (password || '').toString();
    if (!e || !p) return res.status(400).json({ error: 'missing_email_or_password' });

    const pool = await getPool();

    // Check trùng email
    const exist = await pool.request()
      .input('Email', sql.NVarChar(255), e)
      .query(`SELECT TOP 1 Id FROM dbo.Users WHERE Email=@Email`);
    if (exist.recordset.length) return res.status(409).json({ error: 'email_exists' });

    // Hash password
    const hash = await bcrypt.hash(p, 10);

    // Tạo Users (PasswordHash)
    const u = await pool.request()
      .input('Email', sql.NVarChar(255), e)
      .input('Hash', sql.NVarChar(255), hash)
      .input('Role', sql.VarChar(20), 'customer')
      .query(`
        INSERT INTO dbo.Users (Email, PasswordHash, Role, CreatedAt)
        OUTPUT INSERTED.Id
        VALUES (@Email, @Hash, @Role, SYSUTCDATETIME())
      `);

    const userId = u.recordset[0].Id;

    // Upsert Customers — đảm bảo Email NOT NULL
    await pool.request()
      .input('UserId', sql.BigInt, userId)
      .input('Email', sql.NVarChar(255), e)
      .input('FullName', sql.NVarChar(255), fullName || null)
      .input('Phone', sql.NVarChar(50), phone || null)
      .query(`
MERGE dbo.Customers AS c
USING (SELECT @UserId AS UserId, @Email AS Email) AS s
   ON c.UserId = s.UserId OR c.Email = s.Email
WHEN MATCHED THEN
  UPDATE SET
    Email    = @Email,
    FullName = COALESCE(@FullName, c.FullName),
    Phone    = COALESCE(@Phone,    c.Phone)
WHEN NOT MATCHED THEN
  INSERT (UserId, Email, FullName, Phone, CreatedAt)
  VALUES (@UserId, @Email, @FullName, @Phone, SYSUTCDATETIME());
      `);

    res.json({ ok: true, userId });
  } catch (e) {
    console.error('register error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    const pool = await getPool();
    const rs = await pool.request()
      .input('Email', sql.NVarChar(255), String(email).trim().toLowerCase())
      .query(`
        SELECT TOP 1 u.Id, u.Email, u.PasswordHash, u.Role, c.FullName
        FROM dbo.Users u
        LEFT JOIN dbo.Customers c ON c.UserId = u.Id
        WHERE u.Email = @Email
      `);

    if (!rs.recordset.length) {
      return res.status(404).json({ error: 'user_not_found' }); // email không tồn tại
    }

    const row = rs.recordset[0];
    let ok = false;
    try { ok = await bcrypt.compare(password, row.PasswordHash); } catch {}
    if (!ok) return res.status(401).json({ error: 'wrong_password' }); // sai mật khẩu

    res.json({ id: row.Id, email: row.Email, role: row.Role, fullName: row.FullName });
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

    const pool = await getPool();
    await ensureResetTable(pool);

    const u = await pool.request()
      .input('Email', sql.NVarChar(255), email)
      .query(`SELECT TOP 1 Id FROM dbo.Users WHERE Email=@Email`);

    // Luôn trả ok; chỉ gửi mail khi user tồn tại
    if (u.recordset.length) {
      const userId = u.recordset[0].Id;
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

      await pool.request()
        .input('UserId', sql.BigInt, userId)
        .input('Token', sql.NVarChar(200), token)
        .input('Exp', sql.DateTime2, expiresAt)
        .query(`INSERT INTO dbo.PasswordResets (UserId, Token, ExpiresAt) VALUES (@UserId, @Token, @Exp)`);

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
    const pool = await getPool();
    await ensureResetTable(pool);

    const r = await pool.request()
      .input('Token', sql.NVarChar(200), token)
      .query(`SELECT TOP 1 UserId, ExpiresAt, UsedAt FROM dbo.PasswordResets WHERE Token=@Token`);

    if (!r.recordset.length) return res.status(404).json({ error: 'invalid_token' });
    const row = r.recordset[0];
    if (row.UsedAt) return res.status(400).json({ error: 'token_used' });
    if (new Date(row.ExpiresAt) < new Date()) return res.status(400).json({ error: 'token_expired' });

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

    const pool = await getPool();
    await ensureResetTable(pool);

    const r = await pool.request()
      .input('Token', sql.NVarChar(200), token)
      .query(`SELECT TOP 1 Id, UserId, ExpiresAt, UsedAt FROM dbo.PasswordResets WHERE Token=@Token`);

    if (!r.recordset.length) return res.status(404).json({ error: 'invalid_token' });
    const pr = r.recordset[0];
    if (pr.UsedAt) return res.status(400).json({ error: 'token_used' });
    if (new Date(pr.ExpiresAt) < new Date()) return res.status(400).json({ error: 'token_expired' });

    const hash = await bcrypt.hash(String(password), 10);
    await pool.request()
      .input('UserId', sql.BigInt, pr.UserId)
      .input('Hash', sql.NVarChar(255), hash)
      .query(`UPDATE dbo.Users SET PasswordHash=@Hash WHERE Id=@UserId`);

    await pool.request()
      .input('Id', sql.BigInt, pr.Id)
      .query(`UPDATE dbo.PasswordResets SET UsedAt=SYSUTCDATETIME() WHERE Id=@Id`);

    res.json({ ok: true });
  } catch (e) {
    console.error('reset error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

/* ============== HEALING EVENTS (MAP) ============== */
router.get('/healing-events', async (req, res) => {
  try {
    const pool = await getPool();
    const { bbox = '', city = '', category = '', q = '' } = req.query;

    let hasBbox = 0, minLng = null, minLat = null, maxLng = null, maxLat = null;
    if (bbox) {
      const parts = bbox.split(',').map(parseFloat);
      if (parts.length === 4 && parts.every(n => !Number.isNaN(n))) {
        [minLng, minLat, maxLng, maxLat] = parts;
        hasBbox = 1;
      }
    }

    const request = pool.request()
      .input('q', sql.NVarChar, q || '')
      .input('city', sql.NVarChar, city || '')
      .input('category', sql.NVarChar, category || '')
      .input('hasBbox', sql.Int, hasBbox)
      .input('minLng', sql.Decimal(9, 6), minLng)
      .input('maxLng', sql.Decimal(9, 6), maxLng)
      .input('minLat', sql.Decimal(9, 6), minLat)
      .input('maxLat', sql.Decimal(9, 6), maxLat);

    const result = await request.query(`
      SELECT Id, Slug, Title, Category, City,
             VenueName, VenueAddress, Lat, Lng,
             StartTime, EndTime, PriceCents, Currency, ThumbnailUrl
      FROM dbo.Events
      WHERE Published = 1
        AND (@q = N'' OR Title LIKE N'%'+@q+'%' OR VenueName LIKE N'%'+@q+'%' OR City LIKE N'%'+@q+'%')
        AND (@city = N'' OR City = @city)
        AND (@category = N'' OR Category = @category)
        AND ( @hasBbox = 0 OR (Lng BETWEEN @minLng AND @maxLng AND Lat BETWEEN @minLat AND @maxLat) )
      ORDER BY StartTime DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

/* ============== PING DB (test) ============== */
router.get('/ping-db', async (req, res) => {
  try {
    const pool = await getPool();
    const rs = await pool.request().query('SELECT 1 AS ok');
    res.json({ ok: rs.recordset[0].ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/events/:slug → chi tiết sự kiện
router.get('/events/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    if (!slug) return res.status(400).json({ error: 'missing_slug' });

    const pool = await getPool();
    const q = `
      SELECT TOP 1 Id, Slug, Title, Category, City, VenueName, VenueAddress,
             StartTime, EndTime, Capacity, PriceCents, Currency,
             Description, Benefits, Requirements,
             ThumbnailUrl, BannerUrl, Lat, Lng
      FROM dbo.Events
      WHERE Slug = @Slug
    `;
    const r = await pool.request()
      .input('Slug', sql.VarChar(120), slug)
      .query(q);

    if (!r.recordset.length) {
      return res.status(404).json({ error: 'not_found' });
    }
    return res.json(r.recordset[0]);
  } catch (err) {
    console.error('Get event detail error:', err);
    res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

module.exports = router;
