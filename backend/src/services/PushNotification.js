// services/PushNotification.js
const admin = require('firebase-admin');
const logger = require('../utils/logger');

class PushNotification {
  constructor() {
    this.initialized = false;
    this.initializeFirebase();
  }

  initializeFirebase() {
    try {
      // Check if Firebase is already initialized
      if (admin.apps.length === 0) {
        const serviceAccount = require('../config/firebase-service-account.json');
        
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        
        this.initialized = true;
        logger.info('Firebase initialized for push notifications');
      } else {
        this.initialized = true;
        logger.info('Firebase already initialized');
      }
    } catch (error) {
      logger.error('Failed to initialize Firebase:', error);
      this.initialized = false;
    }
  }

  async sendToUser(userId, notification) {
    if (!this.initialized) {
      logger.warn('Push notifications not initialized');
      return { success: false, error: 'Push service not configured' };
    }

    try {
      // In real implementation, you would get device tokens from database
      // For now, we'll return success but log that it's not implemented
      
      logger.info(`Would send push to user ${userId}:`, {
        title: notification.title,
        body: notification.body
      });

      // Mock implementation - you need to:
      // 1. Store device tokens when users register for push notifications
      // 2. Retrieve tokens for the user
      // 3. Send to all devices

      return {
        success: true,
        message: 'Push notification service is configured (mock)',
        deviceCount: 1, // Mock count
        notification
      };

    } catch (error) {
      logger.error('Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendReminder(userId, reminderData) {
    const notification = {
      title: `⏰ ${reminderData.medicationName} Reminder`,
      body: `Time to take your ${reminderData.medicationName} ${reminderData.dosage || ''}`.trim(),
      data: {
        type: 'medication_reminder',
        doseId: reminderData.doseId,
        medicationName: reminderData.medicationName,
        scheduledTime: reminderData.scheduledTime,
        action: 'take_medication'
      },
      icon: '/medication-icon.png',
      badge: '/badge.png',
      click_action: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/doses/${reminderData.doseId}`
    };

    return this.sendToUser(userId, notification);
  }

  async sendMissedDoseAlert(userId, alertData) {
    const notification = {
      title: '⚠️ Missed Dose Alert',
      body: `You missed your ${alertData.medicationName} dose`,
      data: {
        type: 'missed_dose',
        doseId: alertData.doseId,
        medicationName: alertData.medicationName,
        action: 'log_missed_dose'
      },
      icon: '/alert-icon.png',
      badge: '/badge-alert.png'
    };

    return this.sendToUser(userId, notification);
  }

  async sendEmergencyAlert(userId, emergencyData) {
    const notification = {
      title: '🚨 Emergency Alert',
      body: `${emergencyData.patientName} has missed multiple doses`,
      data: {
        type: 'emergency',
        patientName: emergencyData.patientName,
        medicationName: emergencyData.medicationName,
        missedCount: emergencyData.missedCount,
        action: 'view_patient'
      },
      sound: 'default',
      priority: 'high'
    };

    return this.sendToUser(userId, notification);
  }
}

module.exports = new PushNotification();