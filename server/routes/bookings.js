// server/routes/bookings.js
const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const { pool, query, sqlx } = require('../config/db'); // pg adapter (CÓ pool)
const { sendMail } = require('../config/mail');        // mail chung

function emailHtml(b) {
  const amount =
    (Number(b.amount_cents || 0) / 100).toLocaleString('vi-VN') +
    ' ' + (b.currency || 'VND');
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:auto">
      <h2>🎟️ Vé giữ chỗ – ${b.event_title || 'Sự kiện'}</h2>
      <p>Xin chào <b>${b.customer_name || ''}</b>, bạn đã giữ chỗ thành công. Vui lòng thanh toán tại sự kiện.</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:6px 8px">Mã vé</td><td style="padding:6px 8px"><b>${b.code}</b></td></tr>
        <tr><td style="padding:6px 8px">Sự kiện</td><td style="padding:6px 8px">${b.event_title || ''}</td></tr>
        <tr><td style="padding:6px 8px">Thời gian</td><td style="padding:6px 8px">${new Date(b.start_time).toLocaleString('vi-VN')}</td></tr>
        <tr><td style="padding:6px 8px">Số lượng</td><td style="padding:6px 8px">${b.quantity}</td></tr>
        <tr><td style="padding:6px 8px">Giá trị</td><td style="padding:6px 8px">${amount}</td></tr>
        <tr><td style="padding:6px 8px">PTTT</td><td style="padding:6px 8px">${(b.method || 'cash').toUpperCase()}</td></tr>
        <tr><td style="padding:6px 8px">Trạng thái</td><td style="padding:6px 8px">${b.status}</td></tr>
      </table>
      <p style="margin-top:16px">Cảm ơn bạn đã đồng hành cùng Music Space 💚</p>
    </div>`;
}

/* ============================================================
   POST /api/bookings  { slug, method, name, email, phone, quantity }
============================================================ */
router.post('/', async (req, res) => {
  const { slug, method = 'cash', name, email, phone } = req.body || {};
  const qty = Math.max(1, parseInt(req.body?.quantity, 10) || 1);

  if (!slug || !name || !email || !phone) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  let client;
  try {
    if (!pool || typeof pool.connect !== 'function') {
      throw new Error('DB pool is not available');
    }

    client = await pool.connect();
    await client.query('BEGIN');

    // 1) Khóa event theo slug
    const qEv = sqlx`
      SELECT id, title, capacity, price_cents, currency, start_time
      FROM events
      WHERE lower(slug) = lower(${slug})
      LIMIT 1
      FOR UPDATE
    `;
    const evr = await client.query(qEv.text, qEv.values);
    if (!evr.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'event_not_found' });
    }
    const ev = evr.rows[0];

    // 2) Đếm đã đặt (trừ cancelled)
    const qBooked = sqlx`
      SELECT COALESCE(SUM(quantity), 0)::int AS booked
      FROM event_bookings
      WHERE event_id = ${ev.id} AND status <> 'cancelled'
    `;
    const br = await client.query(qBooked.text, qBooked.values);
    const booked = br.rows[0].booked;
    const capacity = Number(ev.capacity || 0);
    const remaining = Math.max(capacity - booked, 0);

    if (capacity && qty > remaining) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'sold_out', remaining });
    }

    // 3) Tạo booking
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const amount = (Number(ev.price_cents || 0) * qty) | 0;

    const qIns = sqlx`
      INSERT INTO event_bookings
        (event_id, code, quantity, amount_cents, method, status,
         customer_name, customer_email, customer_phone, created_at)
      VALUES
        (${ev.id}, ${code}, ${qty}, ${amount}, ${method.toLowerCase()},
         ${'pending'}, ${name}, ${email}, ${phone}, NOW())
      RETURNING id
    `;
    const ir = await client.query(qIns.text, qIns.values);
    const bookingId = ir.rows[0].id;

    await client.query('COMMIT');

    // 4) Gửi mail (ngoài transaction)
    try {
      await sendMail({
        to: email,
        subject: `Vé giữ chỗ • ${ev.title}`,
        html: emailHtml({
          code,
          quantity: qty,
          amount_cents: amount,
          currency: ev.currency || 'VND',
          method,
          status: 'pending',
          event_title: ev.title,
          start_time: ev.start_time,
          customer_name: name,
        }),
      });
      // cập nhật sent_at (không chặn flow nếu lỗi)
      await query('UPDATE event_bookings SET sent_at = NOW() WHERE id = $1', [bookingId]);
    } catch (mailErr) {
      console.warn('send mail failed:', mailErr.message);
    }

    return res.json({
      ok: true,
      code,
      id: bookingId,
      redirect: `/pages/booking-success.html?code=${encodeURIComponent(code)}`
    });
  } catch (e) {
    if (client) { try { await client.query('ROLLBACK'); } catch {} }
    console.error('bookings/create error:', e);
    return res.status(500).json({ error: 'server_error', detail: e.message });
  } finally {
    if (client) client.release();
  }
});

/* ============================================================
   GET /api/bookings/by-code/:code  -> trả thông tin vé (PascalCase)
   (alias) GET /api/bookings/:code
============================================================ */
async function getByCode(req, res) {
  try {
    const code = String(req.params.code || '').trim();
    if (!code) return res.status(400).json({ error: 'missing_code' });

    const q = sqlx`
      SELECT
        b.code           AS "Code",
        b.quantity       AS "Quantity",
        b.amount_cents   AS "AmountCents",
        b.method         AS "Method",
        b.status         AS "Status",
        b.created_at     AS "CreatedAt",
        b.sent_at        AS "SentAt",
        b.customer_name  AS "CustomerName",
        b.customer_email AS "CustomerEmail",
        b.customer_phone AS "CustomerPhone",
        e.id             AS "EventId",
        e.title          AS "EventTitle",
        e.slug           AS "Slug",
        e.start_time     AS "StartTime",
        e.end_time       AS "EndTime",
        e.currency       AS "Currency",
        e.venue_name     AS "VenueName",
        e.city           AS "City",
        e.banner_url     AS "BannerUrl",
        e.thumbnail_url  AS "ThumbnailUrl"
      FROM event_bookings b
      JOIN events e ON e.id = b.event_id
      WHERE UPPER(b.code) = UPPER(${code})
      LIMIT 1
    `;
    const r = await query(q.text, q.values);
    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error('get booking by code error:', e);
    res.status(500).json({ error: 'server_error', detail: e.message });
  }
}
router.get('/by-code/:code', getByCode);
router.get('/:code', getByCode); // alias

module.exports = router;
