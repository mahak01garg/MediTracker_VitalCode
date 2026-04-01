const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const {auth,firebaseAuth} = require('../middleware/auth');

router.use(auth);

router.get('/pending', reminderController.getPendingReminders);
router.post('/snooze/:doseId', reminderController.snoozeReminder);
router.post('/test-notification', reminderController.sendTestNotification);
router.get('/settings', reminderController.getReminderSettings);
router.put('/settings', reminderController.updateReminderSettings);

module.exports = router;