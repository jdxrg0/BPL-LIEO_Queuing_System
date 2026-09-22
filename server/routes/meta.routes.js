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
router.post('/admin/reset-data', verifyToken, metaController.resetAllData);
router.get('/priority-groups', metaController.getPriorityGroups);
router.post('/priority-groups', verifyToken, metaController.createPriorityGroup);
router.put('/priority-groups/:id', verifyToken, metaController.updatePriorityGroup);
router.delete('/priority-groups/:id', verifyToken, metaController.deletePriorityGroup);

module.exports = router;
