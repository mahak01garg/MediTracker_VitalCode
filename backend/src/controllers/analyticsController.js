const AnalyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

class AnalyticsController {
  // Get dashboard overview statistics
  async getDashboardOverview(req, res) {
    try {
      const userId = req.userId || req.user?.id;
 if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: userId missing'
      });
    }
      const { startDate, endDate } = req.query;
      
      const overview = await AnalyticsService.getDashboardOverview(userId, { startDate, endDate });
      
      res.status(200).json({
        success: true,
        data: overview
      });
    } catch (error) {
      logger.error('Error getting dashboard overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
    }
  }

  // Get medication adherence analytics
  async getAdherenceAnalytics(req, res) {
    try {
      const { userId } = req;
      const { medicationId, startDate, endDate, groupBy } = req.query;
      
      const analytics = await AnalyticsService.getAdherenceAnalytics(userId, {
        medicationId,
        startDate,
        endDate,
        groupBy
      });
      
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error getting adherence analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch adherence analytics',
        error: error.message
      });
    }
  }

  // Get medication consumption trends
  async getConsumptionTrends(req, res) {
    try {
      const { userId } = req;
      const { period, medicationId } = req.query;
      
      const trends = await AnalyticsService.getConsumptionTrends(userId, {
        period: period || 'week',
        medicationId
      });
      
      res.status(200).json({
        success: true,
        data: trends
      });
    } catch (error) {
      logger.error('Error getting consumption trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch consumption trends',
        error: error.message
      });
    }
  }

  // Get side effects analytics
  async getSideEffectsAnalytics(req, res) {
    try {
      const { userId } = req;
      const { startDate, endDate } = req.query;
      
      const analytics = await AnalyticsService.getSideEffectsAnalytics(userId, {
        startDate,
        endDate
      });
      
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error getting side effects analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch side effects analytics',
        error: error.message
      });
    }
  }

  // Get comparison analytics
  async getComparisonAnalytics(req, res) {
    try {
      const { userId } = req;
      const { period, medications } = req.query;
      
      const analytics = await AnalyticsService.getComparisonAnalytics(userId, {
        period: period || 'month',
        medications: medications ? medications.split(',') : []
      });
      
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error getting comparison analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch comparison analytics',
        error: error.message
      });
    }
  }

  // Get predictive insights
  async getPredictiveInsights(req, res) {
    try {
      const { userId } = req;
      
      const insights = await AnalyticsService.getPredictiveInsights(userId);
      
      res.status(200).json({
        success: true,
        data: insights
      });
    } catch (error) {
      logger.error('Error getting predictive insights:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch predictive insights',
        error: error.message
      });
    }
  }

  // Export analytics data
  async exportAnalyticsData(req, res) {
    try {
      const { userId } = req;
      const { format, startDate, endDate } = req.query;
      
      const exportData = await AnalyticsService.exportAnalyticsData(userId, {
        format: format || 'csv',
        startDate,
        endDate
      });
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=meditracker-analytics-${Date.now()}.csv`);
      
      res.status(200).send(exportData);
    } catch (error) {
      logger.error('Error exporting analytics data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics data',
        error: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();