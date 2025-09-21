const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { sql, getPool } = require('../config/db');

/* ---------- Mailer ---------- */
function mailer() {
  const port = Number(process.env.SMTP_PORT || 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465, // 465 = SSL, 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
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
      <tr><td style="padding:6px 8px">Thời gian</td><td style="padding:6px 8px">${b.StartTime ? new Date(b.StartTime).toLocaleString('vi-VN') : ''}</td></tr>
      <tr><td style="padding:6px 8px">Số lượng</td><td style="padding:6px 8px">${b.Quantity}</td></tr>
      <tr><td style="padding:6px 8px">Giá trị</td><td style="padding:6px 8px">${amount}</td></tr>
      <tr><td style="padding:6px 8px">PTTT</td><td style="padding:6px 8px">${(b.Method || 'cash').toUpperCase()}</td></tr>
      <tr><td style="padding:6px 8px">Trạng thái</td><td style="padding:6px 8px">${b.Status}</td></tr>
    </table>
    <p style="margin-top:18px">Cảm ơn bạn đã đồng hành cùng Music Space 💚</p>
  </div>`;
}

/* ---------- Health ---------- */
router.get('/bookings/health', (_req, res) => res.json({ ok: true }));

/* ---------- Tạo vé + KIỂM TRA CAPACITY + gửi mail ngay ---------- */
router.post('/bookings', async (req, res) => {
  let tx;
  try {
    let { slug, method = 'cash', name, email, phone, quantity = 1 } = req.body || {};
    if (!slug || !name || !email || !phone) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    slug = String(slug).toLowerCase().trim();
    quantity = Math.max(parseInt(quantity, 10) || 1, 1);

    const pool = await getPool();
    tx = new sql.Transaction(pool);
    await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE); // khóa chống overbook

    // 1) Khóa event & lấy Capacity/giá
    const evReq = new sql.Request(tx);
    const evq = await evReq
      .input('Slug', sql.VarChar(120), slug)
      .query(`
        SELECT TOP 1 Id, Title, PriceCents, Currency, StartTime, Capacity
        FROM dbo.Events WITH (UPDLOCK, HOLDLOCK)
        WHERE LOWER(LTRIM(RTRIM(Slug))) = @Slug
      `);
    if (!evq.recordset.length) {
      await tx.rollback();
      return res.status(404).json({ error: 'event_not_found', slug });
    }
    const ev = evq.recordset[0];

    // 2) Tính đã bán (pending/confirmed/checked_in)
    const soldReq = new sql.Request(tx);
    const soldQ = await soldReq
      .input('EventId', sql.BigInt, ev.Id)
      .query(`
        SELECT ISNULL(SUM(Quantity),0) AS sold
        FROM dbo.EventBookings WITH (UPDLOCK, HOLDLOCK)
        WHERE EventId=@EventId
          AND Status IN ('pending','confirmed','checked_in')
      `);
    const sold = Number(soldQ.recordset[0].sold || 0);

    // 3) Check capacity
    const capacity = ev.Capacity == null ? null : Number(ev.Capacity);
    if (capacity != null) {
      const remaining = Math.max(capacity - sold, 0);
      if (quantity > remaining) {
        await tx.rollback();
        return res.status(409).json({
          error: 'sold_out',
          message: 'Không đủ vé trống.',
          remaining
        });
      }
    }

    // 4) Insert booking
    const amountCents = (ev.PriceCents ? Number(ev.PriceCents) : 0) * quantity;
    const code = 'MS' + Date.now().toString().slice(-6);

    const insReq = new sql.Request(tx);
    const ins = await insReq
      .input('EventId',     sql.BigInt,        ev.Id)
      .input('Code',        sql.VarChar(16),   code)
      .input('CustName',    sql.NVarChar(255), name)
      .input('CustEmail',   sql.NVarChar(255), email)
      .input('CustPhone',   sql.NVarChar(50),  phone)
      .input('Quantity',    sql.Int,           quantity)
      .input('AmountCents', sql.Int,           amountCents)
      .input('Method',      sql.VarChar(20),   method)
      .query(`
        INSERT INTO dbo.EventBookings
          (EventId, Code, CustomerName, CustomerEmail, CustomerPhone,
           Quantity, AmountCents, Method, Status, CreatedAt)
        OUTPUT INSERTED.Id
        VALUES
          (@EventId, @Code, @CustName, @CustEmail, @CustPhone,
           @Quantity, @AmountCents, @Method, N'pending', SYSUTCDATETIME())
      `);

    const bookingId = ins.recordset[0].Id;

    // 5) Commit trước, gửi mail sau (tránh giữ lock)
    await tx.commit();

    // 6) Gửi mail (không chặn flow)
    let mailed = false, mailErr = null;
    try {
      const b = {
        Id: bookingId,
        Code: code,
        CustomerName: name,
        CustomerEmail: email,
        CustomerPhone: phone,
        Quantity: quantity,
        AmountCents: amountCents,
        Method: method,
        Status: 'pending',
        EventTitle: ev.Title,
        StartTime: ev.StartTime,
        Currency: ev.Currency || 'VND',
      };

      await mailer().sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: email,
        subject: `Vé giữ chỗ • ${ev.Title}`,
        html: ticketHtml(b),
      });
      mailed = true;

      // Ghi SentAt nếu có cột
      await pool.request()
        .input('Id', sql.BigInt, bookingId)
        .query(`
IF COL_LENGTH('dbo.EventBookings','SentAt') IS NOT NULL
BEGIN
  UPDATE dbo.EventBookings SET SentAt = SYSUTCDATETIME() WHERE Id=@Id;
END
        `);
    } catch (e) {
      console.error('✉️  send mail error:', e);
      mailErr = e.message;
    }

    return res.json({
      ok: true,
      id: bookingId,
      code,
      mailed,
      mailErr,
      redirect: `/pages/booking-success.html?code=${encodeURIComponent(code)}`
    });
  } catch (e) {
    if (tx) { try { await tx.rollback(); } catch {} }
    console.error('bookings/create error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

/* ---------- Lấy vé theo mã code (cho trang success) ---------- */
router.get('/bookings/by-code/:code', async (req, res) => {
  try {
    const code = (req.params.code || '').trim();
    const p = await getPool();
    const r = await p.request()
      .input('Code', sql.VarChar(16), code)
      .query(`
        SELECT TOP 1 b.*, e.Title AS EventTitle, e.StartTime, e.Currency, e.BannerUrl, e.ThumbnailUrl
        FROM dbo.EventBookings b
        JOIN dbo.Events e ON e.Id = b.EventId
        WHERE b.Code = @Code
      `);
    if (!r.recordset.length) return res.status(404).json({ error: 'not_found' });
    res.json(r.recordset[0]);
  } catch (e) {
    console.error('get by code error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
