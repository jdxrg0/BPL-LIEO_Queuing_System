// @ts-nocheck
export {};
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');

router.get('/', statsController.getStats);
router.get('/history', statsController.getHistory);

router.get('/live-flow', statsController.getLiveFlow);
router.get('/staff-status', statsController.getStaffStatus);

module.exports = router;


