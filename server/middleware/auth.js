const { sql, getPool } = require('../config/db');

// Lấy user từ header x-user-id (client gửi kèm mỗi request sau khi login)
async function getUserFromHeader(req) {
  const id = req.header('x-user-id');
  if (!id) return null;
  const pool = await getPool();
  const rs = await pool.request().input('Id', sql.BigInt, id)
    .query('SELECT TOP 1 Id, Email, Role, FullName FROM dbo.Users WHERE Id=@Id');
  return rs.recordset[0] || null;
}

// server/middleware/auth.js
function requireAuth(req, res, next) {
  const id = req.header('x-user-id');
  const role = req.header('x-user-role'); // FE gửi kèm sau khi login
  if (!id) return res.status(401).json({ error: 'unauthorized' });
  req.user = { id, role: role || 'customer' };
  next();
}

/**
 * roleNeeded: 'manager' | 'admin' | string[]  (VD: ['manager','admin'])
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

module.exports = { requireAuth, requireRole };




    