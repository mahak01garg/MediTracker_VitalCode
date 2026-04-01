const Dose = require('../../models/Dose');
const User = require('../../models/User');
const notificationService = require('../notification/EmailService');
const pushNotification = require('../notification/PushNotification');

class ReminderScheduler {
    constructor() {
        // No need to store thousands of jobs in memory
        this.initializeScheduler();
    }

    initializeScheduler() {
        // Run every minute to check for upcoming doses
        const everyMinute = '* * * * *';
        const everyHour = '0 * * * *';

        const cron = require('node-cron');

        cron.schedule(everyMinute, async () => {
            await this.checkUpcomingDoses();
        });

        cron.schedule(everyHour, async () => {
            await this.checkMissedDoses();
        });

        console.log('✅ Reminder scheduler initialized');
    }

    async checkUpcomingDoses() {
        try {
            const now = new Date();
            const reminderWindow = new Date(now.getTime() + 5 * 60000); // 5 min ahead

            const doses = await Dose.find({
                status: 'pending',
                scheduledTime: { $lte: reminderWindow, $gte: now },
                reminderSent: false
            }).populate('userId', 'notificationPreferences email phone name');

            for (const dose of doses) {
                await this.sendReminder(dose);
                dose.reminderSent = true;
                await dose.save();
            }
        } catch (err) {
            console.error('Error checking upcoming doses:', err);
        }
    }

    async checkMissedDoses() {
        try {
            const now = new Date();
            const missedThreshold = new Date(now.getTime() - 24 * 60 * 60000); // 24 hours ago

            const missedDoses = await Dose.find({
                status: 'pending',
                scheduledTime: { $lt: missedThreshold },
                missedAlertSent: false
            }).populate('userId', 'notificationPreferences email phone name emergencyContact');

            for (const dose of missedDoses) {
                await this.sendMissedDoseAlert(dose);
                dose.missedAlertSent = true;
                await dose.save();
            }
        } catch (err) {
            console.error('Error checking missed doses:', err);
        }
    }

    async sendReminder(dose) {
        const user = dose.userId;
        if (!user) return;
        const prefs = user.notificationPreferences || {};

        const reminderData = {
            userName: user.name,
            medicationName: dose.medicationId?.name || 'Medication',
            dosage: dose.medicationId?.dosage || '',
            scheduledTime: dose.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            doseId: dose._id
        };

        try {
            if (prefs.email && user.email) {
                await notificationService.sendReminderEmail(user.email, reminderData);
            }
            if (prefs.push) {
                await pushNotification.sendReminder(user._id, reminderData);
            }
            // SMS logic can be added here if needed
            await this.logReminder(dose, 'upcoming');
        } catch (err) {
            console.error('Failed to send reminder:', err);
        }
    }

    async sendMissedDoseAlert(dose) {
        const user = dose.userId;
        if (!user) return;

        const alertData = {
            userName: user.name,
            medicationName: dose.medicationId?.name || 'Medication',
            missedTime: dose.scheduledTime.toLocaleString(),
            doseId: dose._id
        };

        try {
            if (user.email) {
                await notificationService.sendMissedDoseAlert(user.email, alertData);
            }
            if (user.emergencyContact?.email) {
                await notificationService.sendEmergencyAlert(
                    user.emergencyContact.email,
                    { ...alertData, patientName: user.name }
                );
            }
            await this.logReminder(dose, 'missed');
        } catch (err) {
            console.error('Failed to send missed dose alert:', err);
        }
    }

    async logReminder(dose, type) {
    if (!dose._id) {
        console.warn("Dose ID missing, skipping reminder log");
        return;
    }
    const Reminder = require('../../models/Reminder');
    const reminder = new Reminder({
        userId: dose.userId._id || dose.userId,
        doseId: dose._id,
        scheduledAt: new Date(),
        type,
        method: 'email',
        status: 'sent'
    });
    try {
        await reminder.save();
    } catch (err) {
        console.error('Failed to log reminder:', err);
    }
}



    // ONE-TIME REMINDER USING setTimeout (memory safe)
    scheduleReminder(dose) {
        const reminderTime = new Date(dose.scheduledTime.getTime() - 5 * 60000); // 5 min before
        const now = new Date();
        const delay = reminderTime - now;

        if (delay > 0) {
            setTimeout(async () => {
                await this.sendReminder(dose);
            }, delay);
        }
    }
     getStatus() {
        return {
            service: 'ReminderScheduler',
            isInitialized: true, // Always true since it auto-initializes
            lastCheck: new Date(),
            upcomingDosesChecked: true,
            missedDosesChecked: true,
            settings: {
                upcomingCheck: 'Every minute',
                missedCheck: 'Every hour'
            }
        };
    }

    // Add health check method
    async healthCheck() {
        try {
            // Test by checking one upcoming dose
            const testDose = await Dose.findOne({ status: 'pending' }).limit(1);
            
            return {
                service: 'ReminderScheduler',
                status: 'HEALTHY',
                canQueryDatabase: !!testDose,
                lastSuccessfulCheck: new Date(),
                uptime: process.uptime()
            };
        } catch (error) {
            return {
                service: 'ReminderScheduler',
                status: 'UNHEALTHY',
                error: error.message,
                timestamp: new Date()
            };
        }
    }
}

module.exports = new ReminderScheduler();
