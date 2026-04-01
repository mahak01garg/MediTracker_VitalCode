
const User = require('../models/User');

class NotificationController {
  static async registerToken(req, res) {
    try {
      const { fcmToken } = req.body;
      const userId = req.userId;

      console.log("Register token body:", req.body);
      console.log("User ID from middleware:", userId);

      if (!fcmToken) {
        return res.status(400).json({ message: 'FCM token missing' });
      }

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: no user' });
      }

      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { fcmTokens: fcmToken } },
        { new: true }
      );

      res.status(200).json({ success: true, message: 'FCM token registered' });
    } catch (error) {
      console.error("Error in registerToken:", error);
      res.status(500).json({ message: 'Failed to register token' });
    }
  }
}

module.exports = NotificationController;
