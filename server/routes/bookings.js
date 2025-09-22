const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { pool, query, sqlx, tx } = require('../config/db'); // adapter Postgres

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
  const amount =
    (Number(b.amount_cents || 0) / 100).toLocaleString('vi-VN') +
    ' ' +
    (b.currency || 'VND');
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:auto">
    <h2>🎟️ Vé giữ chỗ – ${b.event_title || 'Sự kiện'}</h2>
    <p>Xin chào <b>${b.customer_name || ''}</b>,</p>
    <p>Bạn đã giữ chỗ thành công. Vui lòng thanh toán tại sự kiện.</p>
    <table style="border-collapse:collapse">
      <tr><td style="padding:6px 8px">Mã vé</td><td style="padding:6px 8px"><b>${b.code}</b></td></tr>
      <tr><td style="padding:6px 8px">Sự kiện</td><td style="padding:6px 8px">${b.event_title || ''}</td></tr>
      <tr><td style="padding:6px 8px">Thời gian</td><td style="padding:6px 8px">${b.start_time ? new Date(b.start_time).toLocaleString('vi-VN') : ''}</td></tr>
      <tr><td style="padding:6px 8px">Số lượng</td><td style="padding:6px 8px">${b.quantity}</td></tr>
      <tr><td style="padding:6px 8px">Giá trị</td><td style="padding:6px 8px">${amount}</td></tr>
      <tr><td style="padding:6px 8px">PTTT</td><td style="padding:6px 8px">${(b.method || 'cash').toUpperCase()}</td></tr>
      <tr><td style="padding:6px 8px">Trạng thái</td><td style="padding:6px 8px">${b.status}</td></tr>
    </table>
    <p style="margin-top:18px">Cảm ơn bạn đã đồng hành cùng Music Space 💚</p>
  </div>`;
}

/* ---------- Health ---------- */
router.get('/bookings/health', (_req, res) => res.json({ ok: true }));

/* ---------- Tạo vé + KIỂM TRA CAPACITY + gửi mail ngay ---------- */
router.post('/bookings', async (req, res) => {
  let booking;
  try {
    let { slug, method = 'cash', name, email, phone, quantity = 1 } = req.body || {};
    if (!slug || !name || !email || !phone) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    slug = String(slug).toLowerCase().trim();
    quantity = Math.max(parseInt(quantity, 10) || 1, 1);

    booking = await tx(async (q) => {
      // 1) Khóa event theo slug (FOR UPDATE) để chống overbook
      const qEv = sqlx`
        SELECT id, title, price_cents, currency, start_time, capacity
        FROM events
        WHERE LOWER(TRIM(slug)) = ${slug}
        FOR UPDATE
        LIMIT 1
      `;
      const evRes = await q(qEv.text, qEv.values);
      if (!evRes.rows.length) {
        const err = new Error('event_not_found');
        err.statusCode = 404;
        throw err;
      }
      const ev = evRes.rows[0];

      // 2) Tính đã bán (pending/confirmed/checked_in)
      const statuses = ['pending', 'confirmed', 'checked_in'];
      const qSold = sqlx`
        SELECT COALESCE(SUM(quantity), 0)::int AS sold
        FROM event_bookings
        WHERE event_id = ${ev.id}
          AND status = ANY(${statuses})
        FOR UPDATE
      `;
      const soldRes = await q(qSold.text, qSold.values);
      const sold = Number(soldRes.rows[0].sold || 0);

      // 3) Check capacity
      const capacity = ev.capacity == null ? null : Number(ev.capacity);
      if (capacity != null) {
        const remaining = Math.max(capacity - sold, 0);
        if (quantity > remaining) {
          const err = new Error('sold_out');
          err.statusCode = 409;
          err.meta = { remaining };
          throw err;
        }
      }

      // 4) Insert booking
      const amountCents = (ev.price_cents ? Number(ev.price_cents) : 0) * quantity;
      const code = 'MS' + Date.now().toString().slice(-6);

      const qIns = sqlx`
        INSERT INTO event_bookings
          (event_id, code, customer_name, customer_email, customer_phone,
           quantity, amount_cents, method, status, created_at)
        VALUES
          (${ev.id}, ${code}, ${name}, ${email}, ${phone},
           ${quantity}, ${amountCents}, ${method}, ${'pending'}, NOW())
        RETURNING id
      `;
      const ins = await q(qIns.text, qIns.values);
      const bookingId = ins.rows[0].id;

      // Trả dữ liệu cần dùng sau commit
      return {
        id: bookingId,
        code,
        quantity,
        amount_cents: amountCents,
        method,
        status: 'pending',
        event_title: ev.title,
        start_time: ev.start_time,
        currency: ev.currency || 'VND',
        email,
        name,
      };
    });

    // 5) Gửi mail sau khi COMMIT (không giữ lock)
    let mailed = false, mailErr = null;
    try {
      await mailer().sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to: booking.email,
        subject: `Vé giữ chỗ • ${booking.event_title}`,
        html: ticketHtml({
          ...booking,
          customer_name: booking.name,
        }),
      });
      mailed = true;

      // 6) Ghi sent_at
      const qSent = sqlx`UPDATE event_bookings SET sent_at = NOW() WHERE id = ${booking.id}`;
      await query(qSent.text, qSent.values);
    } catch (e) {
      console.error('✉️  send mail error:', e);
      mailErr = e.message;
    }

    return res.json({
      ok: true,
      id: booking.id,
      code: booking.code,
      mailed,
      mailErr,
      redirect: `/pages/booking-success.html?code=${encodeURIComponent(booking.code)}`
    });
  } catch (e) {
    const status = e.statusCode || 500;
    if (e.message === 'sold_out') {
      return res.status(status).json({
        error: 'sold_out',
        message: 'Không đủ vé trống.',
        ...(e.meta || {})
      });
    }
    if (e.message === 'event_not_found') {
      return res.status(status).json({ error: 'event_not_found' });
    }
    console.error('bookings/create error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
});

/* ---------- Lấy vé theo mã code (cho trang success) ---------- */
router.get('/bookings/by-code/:code', async (req, res) => {
  try {
    const code = (req.params.code || '').trim();
    const q = sqlx`
      SELECT b.*,
             e.title AS event_title,
             e.start_time,
             e.currency,
             e.banner_url,
             e.thumbnail_url
      FROM event_bookings b
      JOIN events e ON e.id = b.event_id
      WHERE b.code = ${code}
      LIMIT 1
    `;
    const r = await query(q.text, q.values);
    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error('get by code error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
