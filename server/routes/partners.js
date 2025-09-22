// server/routes/partners.js
const express = require('express');
const router = express.Router();
const { query, sqlx } = require('../config/db');

// Helpers
const toStr = (v) => (typeof v === 'string' ? v.trim() : null);
const isEmail = (s = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// POST /api/partners/register  -> partner_applications
router.post('/partners/register', async (req, res) => {
  try {
    const payload = req.body || {};

    const venueName = toStr(payload.venueName); // -> space_name
    const spaceType = toStr(payload.spaceType);
    const desc = toStr(payload.desc);
    const address = toStr(payload.address);
    const city = toStr(payload.city);
    const region = toStr(payload.district);
    const email = toStr(payload.email);
    const phone = toStr(payload.phone);
    const agreeTos = !!payload.agreeTos;

    // validate tối thiểu
    if (!venueName || !email || !city) {
      return res.status(400).json({ error: 'invalid_payload' });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: 'invalid_email' });
    }

    // tránh spam trùng (email + space_name + city trong 1 ngày)
    const qDup = sqlx`
      SELECT 1
      FROM partner_applications
      WHERE contact_email = ${email}
        AND space_name = ${venueName}
        AND city = ${city}
        AND created_at >= NOW() - INTERVAL '1 day'
      LIMIT 1
    `;
    const dup = await query(qDup.text, qDup.values);
    if (dup.rows.length) {
      return res.status(409).json({ error: 'duplicate_application' });
    }

    // insert
    const qIns = sqlx`
      INSERT INTO partner_applications
        (space_name, space_type, space_desc, address_line, city, region,
         contact_email, contact_phone, agree_tos, status, created_at)
      VALUES
        (${venueName}, ${spaceType}, ${desc}, ${address}, ${city}, ${region},
         ${email}, ${phone}, ${agreeTos}, ${'pending'}, NOW())
      RETURNING *
    `;
    const r = await query(qIns.text, qIns.values);
    const row = r.rows?.[0];

    return res.status(201).json({ id: row?.id, ok: true, record: row });
  } catch (err) {
    console.error('POST /partners/register', err);
    return res.status(500).json({ error: 'server_error', detail: err.message });
  }
});

// GET /api/partners  -> list
router.get('/partners', async (_req, res) => {
  try {
    const r = await query(`
      SELECT id, space_name, space_type,
             LEFT(space_desc, 300) AS space_desc,
             address_line, city, region,
             contact_email, contact_phone, status, created_at
      FROM partner_applications
      ORDER BY created_at DESC
      LIMIT 200
    `, []);
    res.json(r.rows || []);
  } catch (err) {
    console.error('GET /partners', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/partners/:id -> chi tiết
router.get('/partners/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });

    const q = sqlx`SELECT * FROM partner_applications WHERE id = ${id} LIMIT 1`;
    const r = await query(q.text, q.values);
    const row = r.rows?.[0];
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json(row);
  } catch (err) {
    console.error('GET /partners/:id', err);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
