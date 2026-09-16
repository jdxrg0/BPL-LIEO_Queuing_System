const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const socketConfig = require('../config/socket');

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, createdAt: true, counterId: true, counter: true, caterNew: true, caterRenewal: true, caterRetirement: true, profilePictureBase64: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { counter: true }
    });
    if (user) {
      res.json({ id: user.id, username: user.username, name: user.name, role: user.role, counterId: user.counterId, counter: user.counter, caterNew: user.caterNew, caterRenewal: user.caterRenewal, caterRetirement: user.caterRetirement, profilePictureBase64: user.profilePictureBase64 });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, name, role, windowNumber, caterNew, caterRenewal, caterRetirement } = req.body;
    
    let finalCounterId = null;
    if (windowNumber) {
      const counterName = `Window ${windowNumber}`;
      let counter = await prisma.counter.findFirst({ where: { name: counterName } });
      if (!counter) {
        counter = await prisma.counter.create({ data: { name: counterName, isActive: true } });
      }
      finalCounterId = counter.id;
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: { 
        username, 
        passwordHash, 
        name, 
        role,
        counterId: finalCounterId,
        caterNew: caterNew !== undefined ? caterNew : true,
        caterRenewal: caterRenewal !== undefined ? caterRenewal : true,
        caterRetirement: caterRetirement !== undefined ? caterRetirement : true
      }
    });
    res.json({ id: user.id, username: user.username, name: user.name, role: user.role, counterId: user.counterId });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { windowNumber, role, name, username, currentPassword, caterNew, caterRenewal, caterRetirement } = req.body;
    
    const userRecord = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    let isMatch = false;
    if (userRecord.passwordHash.startsWith('$2a$') || userRecord.passwordHash.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(currentPassword, userRecord.passwordHash);
    } else {
      isMatch = userRecord.passwordHash === currentPassword;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    let updateData = {};
    if (role) updateData.role = role;
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (caterNew !== undefined) updateData.caterNew = caterNew;
    if (caterRenewal !== undefined) updateData.caterRenewal = caterRenewal;
    if (caterRetirement !== undefined) updateData.caterRetirement = caterRetirement;

    if (windowNumber !== undefined) {
      if (windowNumber) {
        const counterName = `Window ${windowNumber}`;
        let counter = await prisma.counter.findFirst({ where: { name: counterName } });
        if (!counter) {
          counter = await prisma.counter.create({ data: { name: counterName, isActive: true } });
        }
        updateData.counterId = counter.id;
      } else {
        updateData.counterId = null;
      }
    }
    
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { counter: true }
    });
    
    const updatedUser = { id: user.id, username: user.username, name: user.name, role: user.role, counterId: user.counterId, counter: user.counter, caterNew: user.caterNew, caterRenewal: user.caterRenewal, caterRetirement: user.caterRetirement };
    socketConfig.getIo().emit('userUpdated', updatedUser);
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Security check: only the user can change their own password
    if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Forbidden: Cannot change password for another user' });
    }

    const { currentPassword, newPassword } = req.body;

    const userRecord = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!userRecord) return res.status(404).json({ error: 'User not found' });

    let isMatch = false;
    if (userRecord.passwordHash.startsWith('$2a$') || userRecord.passwordHash.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(currentPassword, userRecord.passwordHash);
    } else {
      isMatch = userRecord.passwordHash === currentPassword;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { passwordHash: newPasswordHash }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role !== 'ADMIN' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'Forbidden: Cannot update profile for another user' });
    }

    const { name, profilePictureBase64 } = req.body;

    const dataToUpdate = { name, profilePictureBase64 };

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      include: { counter: true }
    });

    const safeUser = { id: updatedUser.id, username: updatedUser.username, name: updatedUser.name, role: updatedUser.role, counterId: updatedUser.counterId, counter: updatedUser.counter, caterNew: updatedUser.caterNew, caterRenewal: updatedUser.caterRenewal, caterRetirement: updatedUser.caterRetirement, profilePictureBase64: updatedUser.profilePictureBase64 };
    socketConfig.getIo().emit('userUpdated', safeUser);

    res.json(safeUser);
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { resetKey, newPassword } = req.body;
    const SECRET_RESET_KEY = process.env.SECRET_RESET_KEY;

    if (resetKey !== SECRET_RESET_KEY) {
      return res.status(401).json({ error: 'Invalid reset key' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { passwordHash: newPasswordHash }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    const userRecord = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!userRecord || userRecord.username !== username) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }

    let isMatch = false;
    if (userRecord.passwordHash.startsWith('$2a$') || userRecord.passwordHash.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, userRecord.passwordHash);
    } else {
      isMatch = userRecord.passwordHash === password;
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }

    // Detach User from Tickets
    await prisma.ticket.updateMany({
      where: { createdByUserId: parseInt(id) },
      data: { createdByUserId: null }
    });
    
    await prisma.ticket.updateMany({
      where: { servedByUserId: parseInt(id) },
      data: { servedByUserId: null }
    });

    await prisma.user.delete({ where: { id: parseInt(id) } });
    
    // Notify clients that the user was deleted so they can log them out if logged in
    try {
      socketConfig.getIo().emit('userDeleted', parseInt(id));
    } catch (e) {
      console.error('Socket error on deleteUser:', e);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  changePassword,
  updateUserProfile,
  resetPassword,
  deleteUser
};
