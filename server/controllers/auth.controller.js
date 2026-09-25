const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { SECRET_KEY } = require('../middlewares/auth.middleware');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { username },
      include: { counter: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password (support both bcrypt and legacy plain text for transition)
    let isMatch = false;
    if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
      isMatch = user.passwordHash === password;
      // Optional: Update to hashed password here for transparent migration
      if (isMatch) {
         const salt = await bcrypt.genSalt(10);
         const hashed = await bcrypt.hash(password, salt);
         await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashed } });
      }
    }

    if (isMatch) {
      // Create token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        SECRET_KEY,
        { expiresIn: '24h' }
      );

      res.json({
        token, // Send token to client
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        counterId: user.counterId,
        counter: user.counter,
        caterNew: user.caterNew,
        caterRenewal: user.caterRenewal,
        caterRetirement: user.caterRetirement,
        autoAssign: user.autoAssign,
        profilePictureBase64: user.profilePictureBase64
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

module.exports = { login };
