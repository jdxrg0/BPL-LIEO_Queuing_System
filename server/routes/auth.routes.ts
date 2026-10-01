// @ts-nocheck
export {};
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginLimiter } = require('../middlewares/rateLimit.middleware');

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);

module.exports = router;


