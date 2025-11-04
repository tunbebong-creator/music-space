import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('⚠️ No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error('❌ JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('✅ Token verified - user:', { id: user.id, email: user.email, role: user.role });
    req.user = user;
    next();
  });
};
