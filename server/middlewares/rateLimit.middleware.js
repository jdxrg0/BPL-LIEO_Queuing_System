const rateLimit = require('express-rate-limit');

// Strict rate limiter for login route to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per `window` (here, per 15 minutes)
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true, 
  legacyHeaders: false,
});

// The system runs on a private LAN, so internal traffic (kiosks, staff, TV displays,
// admin) must never be throttled mid-burst. External/tracked connections still get
// protected by the ceiling below.
const isTrustedLanRequest = (req) => {
  const ip = (req.ip || req.connection?.remoteAddress || '').replace(/^::ffff:/, '');
  return ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip);
};

// General rate limiter to prevent DDoS from external networks
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600, // Limit each IP to 600 requests per `window` (here, per 1 minute)
  message: { error: 'Too many requests from this IP, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: isTrustedLanRequest,
});

module.exports = { loginLimiter, apiLimiter };
