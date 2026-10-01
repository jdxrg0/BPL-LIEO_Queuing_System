const fs = require('fs');
let content = fs.readFileSync('server/controllers/auth.controller.js', 'utf8');

if (!content.includes('const logout =')) {
  const logoutCode = `
const logout = async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId) {
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { isOnline: false }
      });
      
      try {
        const socketConfig = require('../config/socket');
        if (socketConfig.getIo()) {
          socketConfig.getIo().emit('userOnlineStatus', { userId: parseInt(userId), isOnline: false });
        }
      } catch(e) {}
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
};
`;
  content = content.replace('module.exports = { login };', logoutCode + '\nmodule.exports = { login, logout };');
  fs.writeFileSync('server/controllers/auth.controller.js', content);
  console.log('logout function added to auth.controller.js');
} else {
  console.log('logout function already exists.');
}
