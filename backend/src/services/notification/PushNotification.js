

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
        return { sent: false };
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

      return response;

    } catch (error) {
      logger.error('Push notification error:', error);
      throw error;
    }
  }

  async sendTestNotification(userId) {
    return this.sendNotification(userId, {
      title: '✅ Test Notification',
      body: 'Firebase push is working!',
      data: { type: 'test' }
    });
  }
}


module.exports = new PushNotificationService();
