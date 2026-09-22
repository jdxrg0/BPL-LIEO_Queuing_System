const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAdmin } = require('../middlewares/auth.middleware');

// Note: Token verification is now handled globally in server.js

// Admin-only routes
router.get('/', requireAdmin, userController.getUsers);
router.post('/', requireAdmin, userController.createUser);
router.get('/:id', requireAdmin, userController.getUserById);
router.put('/:id', requireAdmin, userController.updateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);
router.put('/:id/reset-password', requireAdmin, userController.resetPassword);

// Routes accessible by the authenticated user (for their own profile)
router.put('/:id/change-password', userController.changePassword);
router.put('/:id/profile', userController.updateUserProfile);

module.exports = router;
