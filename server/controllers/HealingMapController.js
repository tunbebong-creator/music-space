// controllers/mapController.js (ví dụ)
const { query } = require("../config/db"); // dùng adapter Postgres

module.exports = {
  // Lấy danh sách không gian chữa lành (healing_spaces)
  async listSpaces(req, res) {
    try {
      const { bbox, city, q } = req.query; // bbox = "minLng,minLat,maxLng,maxLat"

      // Xây WHERE động theo tham số
      const clauses = ["1=1"];
      const params = [];
      let i = 1;

      if (city) {
        clauses.push(`city = $${i++}`);
        params.push(city);
      }
      if (q) {
        // tìm theo tên/địa chỉ (không phân biệt hoa thường)
        clauses.push(`(name ILIKE '%' || $${i} || '%' OR address ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i++;
      }
      if (bbox) {
        const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
        clauses.push(`lat BETWEEN $${i} AND $${i + 1}`);
        params.push(minLat, maxLat);
        i += 2;
        clauses.push(`lng BETWEEN $${i} AND $${i + 1}`);
        params.push(minLng, maxLng);
        i += 2;
      }

      const sql = `
        SELECT id, name, city, address, lat, lng,
               thumbnail_url AS cover_url
        FROM healing_spaces
        WHERE ${clauses.join(" AND ")}
        ORDER BY name
      `;

      const { rows } = await query(sql, params);
      res.json(rows);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Load spaces failed" });
    }
  },

  // Trả về events có lat/lng để thả marker
  async listEventsOnMap(req, res) {
    try {
      const { bbox, city, q, category } = req.query;

      const clauses = ["published = true", "lat IS NOT NULL", "lng IS NOT NULL"];
      const params = [];
      let i = 1;

      if (city) {
        clauses.push(`city = $${i++}`);
        params.push(city);
      }
      if (category) {
        clauses.push(`category = $${i++}`);
        params.push(category);
      }
      if (q) {
        clauses.push(`(title ILIKE '%' || $${i} || '%' OR venue_name ILIKE '%' || $${i} || '%')`);
        params.push(q);
        i++;
      }
      if (bbox) {
        const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
        clauses.push(`lat BETWEEN $${i} AND $${i + 1}`);
        params.push(minLat, maxLat);
        i += 2;
        clauses.push(`lng BETWEEN $${i} AND $${i + 1}`);
        params.push(minLng, maxLng);
        i += 2;
      }

      const sql = `
        SELECT id, slug, title, category, city,
               venue_name, venue_address,
               lat, lng,
               price_cents, currency,
               thumbnail_url, start_time, end_time
        FROM events
        WHERE ${clauses.join(" AND ")}
        ORDER BY start_time ASC
      `;

      const { rows } = await query(sql, params);
      res.json(rows);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Load events failed" });
    }
  }
};
