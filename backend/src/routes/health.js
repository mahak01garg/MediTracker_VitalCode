const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const {auth,firebaseAuth} = require('../middleware/auth');

router.use(auth);

// Health entries
router.post('/entries', healthController.createHealthEntry);
router.get('/entries', healthController.getHealthEntries);
router.get('/entries/:id', healthController.getHealthEntry);
router.put('/entries/:id', healthController.updateHealthEntry);
router.delete('/entries/:id', healthController.deleteHealthEntry);

// Analytics
router.get('/analytics/adherence', healthController.getAdherenceAnalytics);
router.get('/analytics/health-trends', healthController.getHealthTrends);
router.get('/analytics/correlation', healthController.getMedicationHealthCorrelation);

// Charts data
router.get('/charts/daily', healthController.getDailyChartData);
router.get('/charts/weekly', healthController.getWeeklyChartData);
router.get('/charts/monthly', healthController.getMonthlyChartData);

module.exports = router;