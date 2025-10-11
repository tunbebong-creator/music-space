// server/routes/partners.js — Postgres version
const express = require('express');
const router = express.Router();
const { query, sqlx } = require('../config/db');

const toStr = v => (typeof v === 'string' ? v.trim() : null);
const isEmail = (s='') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/* Register partner application */
router.post('/partners/register', async (req, res) => {
  try {
    const p = req.body || {};
    const venueName = toStr(p.venueName);
    const spaceType = toStr(p.spaceType);
    const desc      = toStr(p.desc);
    const address   = toStr(p.address);
    const city      = toStr(p.city);
    const region    = toStr(p.district);
    const email     = toStr(p.email);
    const phone     = toStr(p.phone);
    const agreeTos  = !!p.agreeTos;

    if (!venueName || !email || !city) return res.status(400).json({ error: 'invalid_payload' });
    if (!isEmail(email)) return res.status(400).json({ error: 'invalid_email' });

    // chặn spam 1 ngày
    const dup = await query(
      `SELECT 1
         FROM partner_applications
        WHERE contact_email=$1 AND space_name=$2 AND city=$3
          AND created_at >= NOW() - INTERVAL '1 day'
        LIMIT 1`,
      [email, venueName, city]
    );
    if (dup.rows.length) return res.status(409).json({ error: 'duplicate_application' });

    const q = sqlx`
      INSERT INTO partner_applications
        (space_name, space_type, space_desc, address_line, city, region,
         contact_email, contact_phone, agree_tos, status, created_at)
      VALUES
        (${venueName}, ${spaceType}, ${desc}, ${address}, ${city}, ${region},
         ${email}, ${phone}, ${agreeTos}, ${'pending'}, NOW())
      RETURNING *
    `;
    const r = await query(q.text, q.values);
    res.status(201).json({ id: r.rows[0].id, ok: true, record: r.rows[0] });
  } catch (e) {
    console.error('POST /partners/register', e);
    res.status(500).json({ error: 'server_error' });
  }
});

/* List partners */
router.get('/partners', async (_req, res) => {
  try {
    const r = await query(`
      SELECT id, space_name, space_type, space_desc, address_line, city, region,
             contact_email, contact_phone, status, created_at
      FROM partner_applications
      ORDER BY created_at DESC
      LIMIT 200
    `);
    res.json(r.rows);
  } catch (e) {
    console.error('GET /partners', e);
    res.status(500).json({ error: 'server_error' });
  }
});

/* Detail */
router.get('/partners/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });

    const q = sqlx`SELECT * FROM partner_applications WHERE id=${id} LIMIT 1`;
    const r = await query(q.text, q.values);
    if (!r.rows.length) return res.status(404).json({ error: 'not_found' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error('GET /partners/:id', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
