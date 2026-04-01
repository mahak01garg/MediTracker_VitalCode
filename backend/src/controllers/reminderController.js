const Reminder = require('../models/Reminder');
const Dose = require('../models/Dose');
const User = require('../models/User');
const notificationService = require('../services/notification/EmailService');
const pushNotification = require('../services/notification/PushNotification');

exports.getPendingReminders = async (req, res) => {
    try {
        const reminders = await Reminder.find({
            userId: req.userId,
            status: 'pending',
            scheduledAt: { $gte: new Date() }
        })
        .populate('doseId')
        .sort({ scheduledAt: 1 })
        .limit(20);

        res.json({ reminders });
    } catch (error) {
        console.error('Get pending reminders error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.snoozeReminder = async (req, res) => {
    try {
        const { doseId } = req.params;
        const { minutes = 10 } = req.body;

        const dose = await Dose.findOne({
            _id: doseId,
            userId: req.userId
        });

        if (!dose) {
            return res.status(404).json({ error: 'Dose not found' });
        }

        // Update dose status to snoozed
        dose.status = 'snoozed';
        dose.actualTime = null;
        
        // Reschedule the dose
        const newTime = new Date();
        newTime.setMinutes(newTime.getMinutes() + parseInt(minutes));
        dose.scheduledTime = newTime;
        
        await dose.save();

        // Cancel existing reminder
        await Reminder.deleteMany({
            doseId: dose._id,
            status: 'pending'
        });

        // Schedule new reminder
        const reminderScheduler = require('../services/scheduler/ReminderScheduler');
        reminderScheduler.scheduleReminder(dose);

        res.json({
            message: `Reminder snoozed for ${minutes} minutes`,
            dose
        });
    } catch (error) {
        console.error('Snooze reminder error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.sendTestNotification = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        const testData = {
            userName: user.name,
            medicationName: 'Test Medication',
            dosage: '500mg',
            scheduledTime: new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            doseId: 'test123'
        };

        // Send test email
        if (user.email) {
            await notificationService.sendTestEmail(user.email, testData);
        }

        // Send test push notification
        if (user.notificationPreferences.push) {
            await pushNotification.sendTestNotification(user._id, testData);
        }

        res.json({
            message: 'Test notifications sent successfully',
            emailSent: !!user.email,
            pushSent: user.notificationPreferences.push
        });
    } catch (error) {
        console.error('Send test notification error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getReminderSettings = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select('notificationPreferences');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            settings: user.notificationPreferences
        });
    } catch (error) {
        console.error('Get reminder settings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateReminderSettings = async (req, res) => {
    try {
        const { settings } = req.body;

        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update notification preferences
        user.notificationPreferences = {
            ...user.notificationPreferences,
            ...settings
        };

        // Validate phone if SMS is enabled
        if (settings.sms && !user.phone) {
            return res.status(400).json({ 
                error: 'Phone number is required for SMS notifications' 
            });
        }

        await user.save();

        res.json({
            message: 'Reminder settings updated successfully',
            settings: user.notificationPreferences
        });
    } catch (error) {
        console.error('Update reminder settings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};