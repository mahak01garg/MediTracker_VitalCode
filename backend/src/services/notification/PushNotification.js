

const admin = require('../../config/firebase');
const logger = require('../../utils/logger');
const User = require('../../models/User');
const Dose = require('../../models/Dose');

const MAX_FCM_TOKENS_PER_USER = Number(process.env.MAX_FCM_TOKENS_PER_USER || 3);

class PushNotificationService {
    
    async registerToken(userId, fcmToken) {
    if (!fcmToken) return;

    const user = await User.findById(userId);
    if (!user.fcmTokens) user.fcmTokens = [];

    user.fcmTokens = [
      ...user.fcmTokens.filter(token => token !== fcmToken),
      fcmToken
    ].slice(-MAX_FCM_TOKENS_PER_USER);

    await user.save();

    return true;
  }
  async sendNotification(userId, notification) {
    try {
      const user = await User.findById(userId);
      const tokens = [...new Set(user?.fcmTokens || [])].slice(-MAX_FCM_TOKENS_PER_USER);

      if (!user || tokens.length === 0) {
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
        tokens,
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
            invalidTokens.push(tokens[index]);
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
        deviceCount: tokens.length
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
  async reserveDosePush(doseId, fieldName) {
    if (!doseId) return true;

    const dose = await Dose.findOneAndUpdate(
      { _id: doseId, [fieldName]: { $ne: true } },
      { $set: { [fieldName]: true } },
      { new: true }
    );

    if (!dose) {
      logger.info(`Skipping duplicate push for dose ${doseId}`);
      return false;
    }

    return true;
  }

  async sendReminder(userId, reminderData) {
    const reserved = await this.reserveDosePush(reminderData.doseId, 'pushReminderSent');
    if (!reserved) {
      return {
        success: false,
        sent: false,
        successCount: 0,
        failureCount: 0,
        deviceCount: 0,
        skipped: true,
        message: 'Reminder push already sent for this dose'
      };
    }

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
    const reserved = await this.reserveDosePush(alertData.doseId, 'missedPushSent');
    if (!reserved) {
      return {
        success: false,
        sent: false,
        successCount: 0,
        failureCount: 0,
        deviceCount: 0,
        skipped: true,
        message: 'Missed dose push already sent for this dose'
      };
    }

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
