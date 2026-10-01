const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

if (!process.env.JWT_SECRET) {
  throw new Error(
    '[FATAL] JWT_SECRET environment variable is not set. ' +
    'Set it in your .env file before starting the server. ' +
    'Example: JWT_SECRET=your-long-random-secret-here'
  );
}
const SECRET_KEY = process.env.JWT_SECRET;

const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(403).json({ error: 'A token is required for authentication' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    
    // Ensure user still exists
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists. Please log in again.' });
    }
    
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
