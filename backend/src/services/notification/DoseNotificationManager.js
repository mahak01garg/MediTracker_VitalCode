const cron = require('node-cron');
const Dose = require('../../models/Dose');
const User = require('../../models/User');
const EmailService = require('../notification/EmailService');
const PushNotification = require('../notification/PushNotification');
const logger = require('../../utils/logger');

class DoseNotificationManager {
    constructor() {
        this.timezone = 'Asia/Kolkata';
        this.init();
    }

    init() {
        // Run every minute
        cron.schedule('* * * * *', async () => {
            try {
                await this.sendUpcomingReminders();
                await this.sendMissedDoseAlerts();
            } catch (err) {
                logger.error('DoseNotificationManager cron error:', err);
            }
        }, { timezone: this.timezone, scheduled: true });

        logger.info('✅ DoseNotificationManager initialized and running every minute');
    }

    // ========================
    // 1️⃣ Upcoming dose reminders
    // ========================
    async sendUpcomingReminders() {
        const now = new Date();
        const windowEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes ahead

        const doses = await Dose.find({
            status: 'pending',
            scheduledTime: { $gte: now, $lte: windowEnd },
            reminderSent: false
        }).populate('userId medicationId');

        logger.info(`🔔 Upcoming doses found: ${doses.length}`);

        for (const dose of doses) {
            try {
                const user = dose.userId;
                const medication = dose.medicationId;

                if (!user || !medication) continue;

                const reminderData = {
                    userName: user.name || user.email.split('@')[0],
                    medicationName: medication.name,
                    dosage: dose.dosage || medication.dosage,
                    scheduledTime: dose.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    doseId: dose._id
                };

                let success = false;

                // Email
                if (user.notificationPreferences?.email) {
                    const result = await EmailService.sendReminderEmail(user.email, reminderData);
                    success = result?.success || false;
                }

                // Push
                if (user.notificationPreferences?.push) {
                    try {
                        await PushNotification.sendReminder(user._id, reminderData);
                        success = true;
                    } catch (err) {
                        logger.error('Push notification failed for user', user._id, err);
                    }
                }

                if (success) {
                    dose.reminderSent = true;
                    await dose.save();
                    logger.info(`✅ Reminder sent for dose ${dose._id} to ${user.email}`);
                }

            } catch (err) {
                logger.error(`Failed to send upcoming reminder for dose ${dose._id}:`, err);
            }
        }
    }

    // ========================
    // 2️⃣ Missed dose alerts
    // ========================
    async sendMissedDoseAlerts() {
        const now = new Date();
        const missedThreshold = new Date(now.getTime() - 15 * 60 * 1000); // doses older than 15 min

        const doses = await Dose.find({
            status: 'pending',
            scheduledTime: { $lt: missedThreshold },
            missedAlertSent: false
        }).populate('userId medicationId');

        logger.info(`⚠️ Missed doses found: ${doses.length}`);

        for (const dose of doses) {
            try {
                const user = dose.userId;
                const medication = dose.medicationId;

                if (!user || !medication) continue;

                const alertData = {
                    userName: user.name || user.email.split('@')[0],
                    medicationName: medication.name,
                    missedTime: dose.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    doseId: dose._id
                };

                let success = false;

                // Email
                if (user.notificationPreferences?.email) {
                    const result = await EmailService.sendMissedDoseAlert(user.email, alertData);
                    success = result?.success || false;
                }

                // Push
                if (user.notificationPreferences?.push) {
                    try {
                        await PushNotification.sendMissedDose(user._id, alertData);
                        success = true;
                    } catch (err) {
                        logger.error('Push notification failed for missed dose for user', user._id, err);
                    }
                }

                if (success) {
                    dose.status = 'missed';
                    dose.missedAlertSent = true;
                    await dose.save();
                    logger.info(`✅ Missed dose alert sent for dose ${dose._id} to ${user.email}`);
                }

            } catch (err) {
                logger.error(`Failed to send missed dose alert for dose ${dose._id}:`, err);
            }
        }
    }
}

module.exports = new DoseNotificationManager();
