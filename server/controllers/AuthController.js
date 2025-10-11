const bcrypt = require("bcryptjs");
const { query, sqlx } = require("../config/db"); // đổi sang adapter Postgres

const AuthController = {
  async register(req, res) {
    try {
      const { email, password, fullName, phone } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: "Thiếu dữ liệu" });
      }

      // check email trùng
      const qExist = sqlx`SELECT 1 FROM users WHERE email = ${email}`;
      const exist = await query(qExist.text, qExist.values);
      if (exist.rows.length) {
        return res.status(409).json({ error: "Email đã tồn tại" });
      }

      const hash = await bcrypt.hash(password, 10);

      // insert user
      const qUser = sqlx`
        INSERT INTO users (email, password_hash, role)
        VALUES (${email}, ${hash}, ${"customer"})
        RETURNING id
      `;
      const u = await query(qUser.text, qUser.values);
      const userId = u.rows[0].id;

      // insert customer
      const qCustomer = sqlx`
        INSERT INTO customers (user_id, full_name, email, phone)
        VALUES (${userId}, ${fullName}, ${email}, ${phone || null})
      `;
      await query(qCustomer.text, qCustomer.values);

      res.json({ userId, email });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Register failed" });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const q = sqlx`
        SELECT u.id AS user_id, u.email, u.password_hash, u.role,
               c.id AS customer_id, c.full_name
        FROM users u
        LEFT JOIN customers c ON c.user_id = u.id
        WHERE u.email = ${email}
      `;
      const r = await query(q.text, q.values);

      if (!r.rows.length) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });

      const row = r.rows[0];
      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) return res.status(401).json({ error: "Sai email hoặc mật khẩu" });

      res.json({
        userId: row.user_id,
        role: row.role,
        fullName: row.full_name,
        email: row.email,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Login failed" });
    }
  },
};

module.exports = AuthController;
