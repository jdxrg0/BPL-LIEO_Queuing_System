const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'bpl-lieo-super-secret-key';

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(403).json({ error: 'A token is required for authentication' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid Token' });
  }
  return next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  
  return next();
};

module.exports = { verifyToken, requireAdmin, SECRET_KEY };
