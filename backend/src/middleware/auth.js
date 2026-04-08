const jwt = require('jsonwebtoken');
const db  = require('../db');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token  = header?.startsWith('Bearer ')
      ? header.slice(7)
      : req.cookies?.token;

    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query(
      'SELECT id, email, username, full_name, avatar_url, role FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows.length) return res.status(401).json({ error: 'User not found' });

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token  = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await db.query(
      'SELECT id, email, username, role FROM users WHERE id = $1', [decoded.id]
    );
    if (rows.length) req.user = rows[0];
  } catch (_) {}
  next();
};

module.exports = { authenticate, requireAdmin, optionalAuth };
