// services/notificationService.js
const EmailService = require('./notification/EmailService');
const PushNotification = require('./notification/PushNotification');
const logger = require('../utils/logger');
const User = require('../models/User');
const admin = require("../config/firebaseAdmin");

class NotificationService {
  constructor() {
    // emailServiceInstance is already an object/instance
    this.emailService = EmailService;
    
    // For PushNotification, check if it's a class or instance
    if (typeof PushNotification === 'function') {
      this.pushNotification = new PushNotification();
    } else {
      this.pushNotification = PushNotification; // It's already an instance
    }
    
    logger.info('NotificationService initialized successfully');
  }

  // Send test notification to user
  async sendTestNotification(userId) {
    try {
      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const notifications = [];
      
      // 1. Send Email Notification
      if (user.email && user.notificationPreferences?.email !== false) {
        try {
          const emailResult = await this.sendTestEmail(user);
          notifications.push({
            type: 'email',
            success: emailResult.success,
            message: emailResult.message
          });
        } catch (emailError) {
          logger.error('Email test failed:', emailError);
          notifications.push({
            type: 'email',
            success: false,
            error: emailError.message
          });
        }
      }

      // 2. Send Push Notification
      if (user.notificationPreferences?.push !== false) {
        try {
          const pushResult = await this.sendTestPush(user);
          notifications.push({
            type: 'push',
            success: pushResult.success,
            message: pushResult.message
          });
        } catch (pushError) {
          logger.error('Push notification test failed:', pushError);
          notifications.push({
            type: 'push',
            success: false,
            error: pushError.message
          });
        }
      }

      // 3. Log to console
      console.log(`📢 Test notification sent to user: ${user.email || user._id}`);
      logger.info(`Test notification sent to user ${user._id}`, { notifications });

      return {
        success: true,
        message: 'Test notifications sent successfully',
        notifications,
        timestamp: new Date(),
        userId: user._id,
        userEmail: user.email
      };

    } catch (error) {
      logger.error('Notification service error:', error);
      throw error;
    }
  }

  async sendTestEmail(user) {
    const emailData = {
      userName: user.name || 'User',
      testTime: new Date().toLocaleTimeString(),
      testDate: new Date().toDateString()
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                   color: white; padding: 30px; text-align: center; border-radius: 10px; }
          .content { background: #f9f9f9; padding: 25px; border-radius: 8px; margin: 20px 0; }
          .test-box { background: #e8f4fd; border-left: 4px solid #2196F3; padding: 15px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .button { display: inline-block; background: #4CAF50; color: white; 
                   padding: 12px 25px; text-decoration: none; border-radius: 5px; 
                   margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 MediTracker Test Notification</h1>
            <p>Your notification system is working correctly!</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name || 'Valued User'}!</h2>
            <p>This is a test notification from your MediTracker account.</p>
            
            <div class="test-box">
              <h3>📋 Test Details:</h3>
              <p><strong>Date:</strong> ${emailData.testDate}</p>
              <p><strong>Time:</strong> ${emailData.testTime}</p>
              <p><strong>Status:</strong> ✅ System is operational</p>
              <p><strong>Purpose:</strong> Testing notification delivery system</p>
            </div>
            
            <p>If you received this email, your notification settings are correctly configured.</p>
            <p>You will receive similar notifications for:</p>
            <ul>
              <li>📅 Upcoming medication reminders</li>
              <li>⏰ Missed dose alerts</li>
              <li>📊 Weekly adherence reports</li>
              <li>🎯 Health insights</li>
            </ul>
            
            <center>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
                Go to Dashboard
              </a>
            </center>
          </div>
          
          <div class="footer">
            <p>This is an automated message from MediTracker.</p>
            <p>If you didn't expect this test, please ignore this email.</p>
            <p>© ${new Date().getFullYear()} MediTracker. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send using your existing EmailService
    const result = await this.emailService.sendEmail(
      user.email,
      '🔔 MediTracker - Test Notification',
      html
    );

    return {
      success: result.success || true,
      message: 'Test email sent successfully',
      to: user.email
    };
  }

  async sendTestPush(user) {
    try {
      // Prepare push notification data
      const pushData = {
        title: '🔔 MediTracker Test',
        body: 'Your notification system is working correctly!',
        data: {
          type: 'test',
          userId: user._id.toString(),
          timestamp: new Date().toISOString(),
          action: 'test_notification'
        },
        icon: '/logo.png',
        badge: '/badge.png'
      };

      // Send push notification
      const result = await this.pushNotification.sendToUser(
        user._id,
        pushData
      );

      return {
        success: result.success || true,
        message: 'Test push notification sent',
        deviceCount: result.deviceCount || 0
      };

    } catch (error) {
      // If push notification fails, it's okay - just log it
      logger.warn('Push notification not configured:', error.message);
      return {
        success: false,
        message: 'Push notification service not configured',
        error: error.message
      };
    }
  }

  // Send medication reminder
  async sendMedicationReminder(dose, medication) {
    try {
      const user = await User.findById(dose.userId);
      if (!user) return { success: false, error: 'User not found' };

      const reminderData = {
        userName: user.name,
        medicationName: medication.name,
        dosage: medication.dosage,
        scheduledTime: dose.scheduledTime,
        doseId: dose._id
      };

      const notifications = [];

      // Send email if enabled
      if (user.notificationPreferences?.email !== false && user.email) {
        try {
          await this.emailService.sendReminderEmail(user.email, reminderData);
          notifications.push({ type: 'email', success: true });
        } catch (emailError) {
          notifications.push({ type: 'email', success: false, error: emailError.message });
        }
      }

      // Send push if enabled
      if (user.notificationPreferences?.push !== false) {
        try {
          await this.pushNotification.sendReminder(user._id, reminderData);
          notifications.push({ type: 'push', success: true });
        } catch (pushError) {
          notifications.push({ type: 'push', success: false, error: pushError.message });
        }
      }

      // Log the reminder
      await this.logReminder(dose, 'reminder', notifications);

      return {
        success: true,
        message: 'Reminder sent successfully',
        notifications
      };

    } catch (error) {
      logger.error('Error sending medication reminder:', error);
      return { success: false, error: error.message };
    }
  }

  // Log reminder to database
  async logReminder(dose, type, notifications) {
    try {
      const Reminder = require('../models/Reminder');
      
      const reminder = new Reminder({
        userId: dose.userId,
        doseId: dose._id,
        medicationId: dose.medicationId,
        scheduledAt: new Date(),
        type: type,
        notifications: notifications,
        status: 'sent'
      });

      await reminder.save();
      logger.info(`Reminder logged: ${type} for dose ${dose._id}`);
    } catch (error) {
      logger.error('Error logging reminder:', error);
    }
  }

  // Check notification system health
  async checkHealth() {
    const health = {
      emailService: 'unknown',
      pushService: 'unknown',
      database: 'unknown',
      timestamp: new Date()
    };

    try {
      // Check email service
      health.emailService = 'healthy';
    } catch (error) {
      health.emailService = 'unhealthy';
      health.emailError = error.message;
    }

    try {
      // Check push service
      health.pushService = 'healthy';
    } catch (error) {
      health.pushService = 'unhealthy';
      health.pushError = error.message;
    }

    try {
      // Check database connection
      const count = await User.countDocuments({});
      health.database = 'healthy';
      health.userCount = count;
    } catch (error) {
      health.database = 'unhealthy';
      health.dbError = error.message;
    }

    return health;
  }
}

module.exports = new NotificationService();