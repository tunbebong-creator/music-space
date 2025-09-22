const { query, sqlx } = require('../config/db');

// Lấy user từ header x-user-id (client gửi kèm mỗi request sau khi login)
async function getUserFromHeader(req) {
  const id = req.header('x-user-id');
  if (!id) return null;

  const q = sqlx`
    SELECT u.id, u.email, u.role, c.full_name
    FROM users u
    LEFT JOIN customers c ON c.user_id = u.id
    WHERE u.id = ${id}
    LIMIT 1
  `;
  const rs = await query(q.text, q.values);
  return rs.rows[0] || null;
}

// Middleware: yêu cầu có user
function requireAuth(req, res, next) {
  const id = req.header('x-user-id');
  const role = req.header('x-user-role'); // FE gửi kèm sau khi login
  if (!id) return res.status(401).json({ error: 'unauthorized' });
  req.user = { id, role: role || 'customer' };
  next();
}

/**
 * roleNeeded: 'manager' | 'admin' | string[] (VD: ['manager','admin'])
 */
function requireRole(roleNeeded) {
  const allow = Array.isArray(roleNeeded) ? roleNeeded : [roleNeeded];
  return (req, res, next) => {
    const role = (req.user && req.user.role) || req.header('x-user-role');
    if (!role || !allow.includes(role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, getUserFromHeader };
