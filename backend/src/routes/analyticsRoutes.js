const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const {auth,firebaseAuth} = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Dashboard overview
router.get('/dashboard', analyticsController.getDashboardOverview);

// Adherence analytics
router.get('/adherence', analyticsController.getAdherenceAnalytics);

// Consumption trends
router.get('/trends', analyticsController.getConsumptionTrends);

// Side effects analytics
router.get('/side-effects', analyticsController.getSideEffectsAnalytics);

// Comparison analytics
router.get('/comparison', analyticsController.getComparisonAnalytics);

// Predictive insights
router.get('/insights', analyticsController.getPredictiveInsights);

// Export analytics
router.get('/export', analyticsController.exportAnalyticsData);

module.exports = router;