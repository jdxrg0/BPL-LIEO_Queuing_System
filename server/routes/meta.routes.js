const express = require('express');
const router = express.Router();
const metaController = require('../controllers/meta.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/services', metaController.getServices);
router.get('/counters', metaController.getCounters);
router.post('/counters', verifyToken, metaController.createCounter);
router.get('/settings', metaController.getSettings);
router.put('/settings', verifyToken, metaController.updateSettings);
router.post('/admin/auto-balance-counters', verifyToken, metaController.autoBalanceCounters);
router.get('/stats/live-wait-times', metaController.getLiveWaitTimes);

module.exports = router;
