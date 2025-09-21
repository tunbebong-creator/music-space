// server/routes/partners.js
const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/db');

// Helpers
const toStr = (v) => (typeof v === 'string' ? v.trim() : null);
const isEmail = (s='') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// POST /api/partners/register  -> PartnerApplications
router.post('/partners/register', async (req, res) => {
  try {
    const payload = req.body || {};

    const venueName = toStr(payload.venueName);     // -> SpaceName
    const spaceType = toStr(payload.spaceType);     // -> SpaceType
    const desc      = toStr(payload.desc);          // -> SpaceDesc
    const address   = toStr(payload.address);       // -> AddressLine
    const city      = toStr(payload.city);          // -> City
    const region    = toStr(payload.district);      // -> Region
    const email     = toStr(payload.email);
    const phone     = toStr(payload.phone);
    const agreeTos  = !!payload.agreeTos;           // -> AgreeTos (bit)

    // validate tối thiểu
    if (!venueName || !email || !city) {
      return res.status(400).json({ error: 'invalid_payload' });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: 'invalid_email' });
    }

    const pool = await getPool();

    // (optional) tránh spam trùng email + name + city trong 1 ngày
    await pool.request()
      .input('Email', sql.NVarChar(200), email)
      .input('SpaceName', sql.NVarChar(200), venueName)
      .input('City', sql.NVarChar(100), city)
      .query(`
        IF EXISTS (
          SELECT 1 FROM PartnerApplications
          WHERE ContactEmail = @Email
            AND SpaceName = @SpaceName
            AND City = @City
            AND CreatedAt >= DATEADD(day, -1, GETUTCDATE())
        )
        THROW 50001, 'duplicate_application', 1;
      `).catch(e => {
        if (e && e.number === 50001) {
          throw Object.assign(new Error('duplicate_application'), { http: 409 });
        }
        throw e;
      });

    const r = await pool.request()
      .input('SpaceName',     sql.NVarChar(200), venueName)
      .input('SpaceType',     sql.NVarChar(100), spaceType)
      .input('SpaceDesc',     sql.NVarChar(sql.MAX), desc)
      .input('AddressLine',   sql.NVarChar(300), address)
      .input('City',          sql.NVarChar(100), city)
      .input('Region',        sql.NVarChar(100), region)
      .input('ContactEmail',  sql.NVarChar(200), email)
      .input('ContactPhone',  sql.NVarChar(50),  phone)
      .input('AgreeTos',      sql.Bit,           agreeTos)
      .input('Status',        sql.NVarChar(50),  'pending')
      .query(`
        INSERT INTO PartnerApplications
          (SpaceName, SpaceType, SpaceDesc, AddressLine, City, Region,
           ContactEmail, ContactPhone, AgreeTos, Status, CreatedAt)
        OUTPUT INSERTED.*
        VALUES
          (@SpaceName, @SpaceType, @SpaceDesc, @AddressLine, @City, @Region,
           @ContactEmail, @ContactPhone, @AgreeTos, @Status, GETUTCDATE())
      `);

    const row = r.recordset?.[0];
    return res.status(201).json({
      id: row?.Id,
      ok: true,
      record: row
    });
  } catch (err) {
    if (err.http === 409) {
      return res.status(409).json({ error: 'duplicate_application' });
    }
    console.error('POST /partners/register', err);
    return res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/partners  -> list (kèm SpaceDesc tóm tắt)
router.get('/partners', async (_req, res) => {
  try {
    const pool = await getPool();
    const q = await pool.request().query(`
      SELECT TOP 200
        Id, SpaceName, SpaceType, SpaceDesc, AddressLine, City, Region,
        ContactEmail, ContactPhone, Status, CreatedAt,
        CAST(SpaceDesc AS NVARCHAR(300)) AS SpaceDesc
      FROM PartnerApplications
      ORDER BY CreatedAt DESC
    `);
    res.json(q.recordset || []);
  } catch (err) {
    console.error('GET /partners', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/partners/:id  -> chi tiết
router.get('/partners/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid_id' });

    const pool = await getPool();
    const r = await pool.request()
      .input('Id', sql.Int, id)
      .query(`
        SELECT *
        FROM PartnerApplications
        WHERE Id = @Id
      `);
    const row = r.recordset?.[0];
    if (!row) return res.status(404).json({ error: 'not_found' });
    res.json(row);
  } catch (err) {
    console.error('GET /partners/:id', err);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
