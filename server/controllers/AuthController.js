const bcrypt = require("bcryptjs");
const { sql, getPool } = require("../config/db");

const AuthController = {
  async register(req, res) {
    try {
      const { email, password, fullName, phone } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: "Thiếu dữ liệu" });
      }

      const pool = await getPool();

      // check email trùng
      const exist = await pool.request()
        .input("email", sql.NVarChar, email)
        .query("SELECT 1 FROM Users WHERE Email=@email");
      if (exist.recordset.length) {
        return res.status(409).json({ error: "Email đã tồn tại" });
      }

      const hash = await bcrypt.hash(password, 10);

      // insert Users
      const u = await pool.request()
        .input("email", sql.NVarChar, email)
        .input("hash", sql.NVarChar, hash)
        .input("role", sql.VarChar, "customer")
        .query(`
          INSERT INTO Users (Email, PasswordHash, Role)
          VALUES (@email, @hash, @role);
          SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS UserId;
        `);
      const userId = u.recordset[0].UserId;

      // insert Customers
      await pool.request()
        .input("userId", sql.BigInt, userId)
        .input("fullName", sql.NVarChar, fullName)
        .input("email", sql.NVarChar, email)
        .input("phone", sql.NVarChar, phone || null)
        .query(`
          INSERT INTO Customers (UserId, FullName, Email, Phone)
          VALUES (@userId, @fullName, @email, @phone)
        `);

      res.json({ userId, email });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Register failed" });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const pool = await getPool();

      const r = await pool.request()
        .input("email", sql.NVarChar, email)
        .query(`
          SELECT u.Id AS UserId, u.Email, u.PasswordHash, u.Role,
                 c.Id AS CustomerId, c.FullName
          FROM Users u
          LEFT JOIN Customers c ON c.UserId = u.Id
          WHERE u.Email=@email
        `);
      if (!r.recordset.length) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });

      const row = r.recordset[0];
      const ok = await bcrypt.compare(password, row.PasswordHash);
      if (!ok) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });

      res.json({
        userId: row.UserId,
        role: row.Role,
        fullName: row.FullName,
        email: row.Email,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Login failed" });
    }
  },
};

module.exports = AuthController;
