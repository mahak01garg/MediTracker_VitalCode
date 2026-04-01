// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { auth,firebaseAuth } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const NotificationController = require('../controllers/notificationController');
// All routes require authentication
router.use(auth);

// Send test notification
router.post('/test', async (req, res) => {
  try {
    console.log('Test notification requested by user:', req.user._id);
    
    const result = await notificationService.sendTestNotification(req.user._id);
    
    res.json({
      success: true,
      message: 'Test notification sent successfully',
      ...result
    });
    
  } catch (error) {
    console.error('Error in test notification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test notification'
    });
  }
});

// Check notification system health
router.get('/health', async (req, res) => {
  try {
    const health = await notificationService.checkHealth();
    
    res.json({
      success: true,
      health,
      timestamp: new Date()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check notification health'
    });
  }
});

// Send medication reminder (for testing)
router.post('/reminder/test', async (req, res) => {
  try {
    const { medicationName, dosage } = req.body;
    
    const mockDose = {
      _id: 'test-dose-123',
      userId: req.user._id,
      scheduledTime: new Date()
    };
    
    const mockMedication = {
      name: medicationName || 'Test Medication',
      dosage: dosage || '500mg'
    };
    
    const result = await notificationService.sendMedicationReminder(mockDose, mockMedication);
    
    res.json({
      success: true,
      message: 'Test reminder sent',
      ...result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user notification preferences
router.get('/preferences', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      preferences: user.notificationPreferences || {
        email: true,
        push: true,
        sms: false
      },
      email: user.email
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get preferences'
    });
  }
});

// Update notification preferences
router.put('/preferences', async (req, res) => {
  try {
    const { email, push, sms } = req.body;
    const User = require('../models/User');
    
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        notificationPreferences: {
          email: email !== undefined ? email : true,
          push: push !== undefined ? push : true,
          sms: sms !== undefined ? sms : false
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Notification preferences updated'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});
router.post('/register-token',auth, NotificationController.registerToken);

module.exports = router;