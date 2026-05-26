

const admin = require('../../config/firebase');
const logger = require('../../utils/logger');
const User = require('../../models/User');

class PushNotificationService {
    
    async registerToken(userId, fcmToken) {
    if (!fcmToken) return;

    const user = await User.findById(userId);
    if (!user.fcmTokens) user.fcmTokens = [];

    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    return true;
  }
  async sendNotification(userId, notification) {
    try {
      const user = await User.findById(userId);

      if (!user || !Array.isArray(user.fcmTokens) || user.fcmTokens.length === 0) {
        logger.info(`No FCM tokens for user ${userId}`);
        return {
          success: false,
          sent: false,
          successCount: 0,
          failureCount: 0,
          deviceCount: 0,
          message: 'No FCM tokens registered for user'
        };
      }

      // 🔐 Ensure data payload values are strings
      const dataPayload = {};
      if (notification.data) {
        Object.keys(notification.data).forEach(key => {
          dataPayload[key] = String(notification.data[key]);
        });
      }

      const message = {
        tokens: user.fcmTokens,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: dataPayload,
        android: {
          priority: 'high',
          notification: {
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // 🧹 Remove invalid tokens
      const invalidTokens = [];
      response.responses.forEach((res, index) => {
        if (!res.success) {
          const errorCode = res.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(user.fcmTokens[index]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        user.fcmTokens = user.fcmTokens.filter(
          token => !invalidTokens.includes(token)
        );
        await user.save();
      }

      return {
        ...response,
        success: response.successCount > 0,
        sent: response.successCount > 0,
        deviceCount: user.fcmTokens.length
      };

    } catch (error) {
      logger.error('Push notification error:', error);
      throw error;
    }
  }

  async sendToUser(userId, notification) {
    return this.sendNotification(userId, notification);
  }

  async sendTestNotification(userId) {
    return this.sendNotification(userId, {
      title: '✅ Test Notification',
      body: 'Firebase push is working!',
      data: { type: 'test' }
    });
  }
  async sendReminder(userId, reminderData) {
    return this.sendNotification(userId, {
      title: 'Medication Reminder',
      body: `${reminderData.medicationName || 'Medication'}${reminderData.dosage ? ` (${reminderData.dosage})` : ''} is due at ${reminderData.scheduledTime || 'now'}.`,
      data: {
        type: 'medication_reminder',
        doseId: reminderData.doseId || '',
        medicationName: reminderData.medicationName || 'Medication'
      }
    });
  }

  async sendMissedDose(userId, alertData) {
    return this.sendNotification(userId, {
      title: 'Missed Dose Alert',
      body: `You missed ${alertData.medicationName || 'a medication'} scheduled at ${alertData.missedTime || 'earlier'}.`,
      data: {
        type: 'missed_dose',
        doseId: alertData.doseId || '',
        medicationName: alertData.medicationName || 'Medication'
      }
    });
  }
}


module.exports = new PushNotificationService();
