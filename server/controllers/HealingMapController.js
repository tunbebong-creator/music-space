const { sql, getPool } = require("../config/db");

module.exports = {
  // Lấy danh sách KHÔNG GIAN (nếu có bảng Spaces) + filter theo bbox, city, keyword
  async listSpaces(req, res) {
    try {
      const { bbox, city, q } = req.query; // bbox = "minLng,minLat,maxLng,maxLat"
      const pool = await getPool();

      let where = "1=1";
      if (city) where += " AND City = @city";
      if (q)    where += " AND (Name LIKE '%' + @q + '%' OR Address LIKE '%' + @q + '%')";

      // filter theo bounding box (nếu có bbox)
      let bboxFilter = "";
      if (bbox) {
        const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
        bboxFilter = " AND Lat BETWEEN @minLat AND @maxLat AND Lng BETWEEN @minLng AND @maxLng";
      }

      const r = await pool.request()
        .input("city", sql.NVarChar, city || null)
        .input("q", sql.NVarChar, q || null)
        .input("minLat", sql.Decimal(9,6), bbox ? bbox.split(",")[1] : null)
        .input("maxLat", sql.Decimal(9,6), bbox ? bbox.split(",")[3] : null)
        .input("minLng", sql.Decimal(9,6), bbox ? bbox.split(",")[0] : null)
        .input("maxLng", sql.Decimal(9,6), bbox ? bbox.split(",")[2] : null)
        .query(`
          SELECT Id, Name, City, Address, Lat, Lng, CoverUrl
          FROM Spaces
          WHERE ${where} ${bbox ? bboxFilter : ""}
          ORDER BY Name
        `);

      res.json(r.recordset);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Load spaces failed" });
    }
  },

  // Nếu KHÔNG có bảng Spaces: trả về sự kiện có lat/lng để thả marker
  async listEventsOnMap(req, res) {
    try {
      const { bbox, city, q, category } = req.query;
      const pool = await getPool();

      let where = "Published=1 AND VenueLat IS NOT NULL AND VenueLng IS NOT NULL";
      if (city) where += " AND City = @city";
      if (category) where += " AND Category = @category";
      if (q) where += " AND (Title LIKE '%' + @q + '%' OR VenueName LIKE '%' + @q + '%')";

      let bboxFilter = "";
      if (bbox) {
        const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);
        bboxFilter =
          " AND VenueLat BETWEEN @minLat AND @maxLat AND VenueLng BETWEEN @minLng AND @maxLng";
      }

      const r = await pool.request()
        .input("city", sql.NVarChar, city || null)
        .input("category", sql.NVarChar, category || null)
        .input("q", sql.NVarChar, q || null)
        .input("minLat", sql.Decimal(9,6), bbox ? bbox.split(",")[1] : null)
        .input("maxLat", sql.Decimal(9,6), bbox ? bbox.split(",")[3] : null)
        .input("minLng", sql.Decimal(9,6), bbox ? bbox.split(",")[0] : null)
        .input("maxLng", sql.Decimal(9,6), bbox ? bbox.split(",")[2] : null)
        .query(`
          SELECT Id, Slug, Title, Category, City, VenueName, VenueAddress,
                 VenueLat AS Lat, VenueLng AS Lng,
                 PriceCents, Currency, ThumbnailUrl, StartTime, EndTime
          FROM Events
          WHERE ${where} ${bbox ? bboxFilter : ""}
          ORDER BY StartTime ASC
        `);

      res.json(r.recordset);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Load events failed" });
    }
  }
};
