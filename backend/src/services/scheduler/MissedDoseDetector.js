const mongoose = require('mongoose');
const Dose = require('../../models/Dose');
const Medication = require('../../models/Medication');
const User = require('../../models/User');
const EmailService = require('../notification/EmailService');
const logger = require('../../utils/logger');
const cron = require('node-cron');

class MissedDoseDetector {
    constructor() {
        this.checkInterval = 15 * 60 * 1000; // Check every 15 minutes
        this.isRunning = false;
        this.lastRun = null;
        this.totalChecks = 0;
        this.totalMissedFound = 0;
        this.totalRemindersSent = 0;
        this.errors = [];
        this.scheduledTask = null;
        this.reminderTask = null;
        this.lastCheckResult = null;
    }

    init() {
        try {
            if (this.scheduledTask || this.reminderTask) {
                logger.warn('MissedDoseDetector already initialized');
                return;
            }

            // Schedule to run every 15 minutes
            this.scheduledTask = cron.schedule('*/15 * * * *', async () => {
                await this.runScheduledCheck();
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata",
                name: 'missed-dose-checker'
            });

            // Also check for upcoming doses every 5 minutes
            this.reminderTask = cron.schedule('*/5 * * * *', async () => {
                await this.runUpcomingDoseCheck();
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata",
                name: 'upcoming-dose-reminder'
            });

            logger.info('✅ MissedDoseDetector initialized with scheduled checks');
        } catch (error) {
            logger.error('Failed to initialize MissedDoseDetector:', error);
        }
    }

    async runScheduledCheck() {
        try {
            this.isRunning = true;
            const result = await this.checkForMissedDoses();
            this.lastRun = new Date();
            this.totalChecks++;
            
            if (result.found) {
                this.totalMissedFound += result.found;
            }
            
            this.lastCheckResult = result;
            logger.info(`✅ Missed dose check completed. Found: ${result.found || 0}`);
            
            return result;
        } catch (error) {
            this.errors.push({
                timestamp: new Date(),
                method: 'checkForMissedDoses',
                error: error.message
            });
            logger.error('❌ Error in scheduled missed dose check:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    async runUpcomingDoseCheck() {
        try {
            const count = await this.checkUpcomingDoses();
            this.totalRemindersSent += count;
            if (count > 0) {
                logger.info(`✅ Sent ${count} upcoming dose reminders`);
            }
            return count;
        } catch (error) {
            this.errors.push({
                timestamp: new Date(),
                method: 'checkUpcomingDoses',
                error: error.message
            });
            logger.error('❌ Error in upcoming dose check:', error);
            throw error;
        }
    }

    // Method to manually trigger the check (for API calls)
    async run() {
        return await this.runScheduledCheck();
    }

    // Your existing methods (keeping them as-is but adding better logging)
    async checkForMissedDoses() {
        try {
            const now = new Date();
            const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            logger.info('🔍 Checking for missed doses...');

            // Find doses that were scheduled in the past 1 hour but not taken
            const missedDoses = await Dose.find({
                scheduledTime: {
                    $gte: oneHourAgo,
                    $lte: fifteenMinutesAgo
                },
                status: 'pending',
                notified: { $ne: true }
            }).populate('medicationId').populate('userId');

            logger.info(`Found ${missedDoses.length} potential missed doses`);

            for (const dose of missedDoses) {
                await this.handleMissedDose(dose);
            }

            return {
                checked: new Date(),
                found: missedDoses.length,
                processed: missedDoses.length,
                success: true
            };

        } catch (error) {
            logger.error('Error checking missed doses:', error);
            this.errors.push({
                timestamp: new Date(),
                method: 'checkForMissedDoses',
                error: error.message
            });
            throw error;
        }
    }

    async handleMissedDose(dose) {
        try {
            const user = dose.userId;
            const medication = dose.medicationId;

            if (!user || !medication) {
                logger.warn(`Skipping dose ${dose._id} - missing user or medication data`);
                return;
            }

            // Update dose status
            dose.status = 'missed';
            dose.missedAt = new Date();
            dose.notified = true;
            await dose.save();

            logger.info(`Marked dose ${dose._id} as missed for user ${user.email}`);

            // Send notification to user
            await this.notifyUser(user, medication, dose);

            // Check if we should notify emergency contacts
            await this.checkEmergencyNotification(user, medication, dose);

        } catch (error) {
            logger.error(`Error handling missed dose ${dose._id}:`, error);
        }
    }

    async notifyUser(user, medication, dose) {
        try {
            const emailData = {
                userName: user.name || user.email.split('@')[0],
                medicationName: medication.name,
                missedTime: dose.scheduledTime.toLocaleTimeString(),
                doseId: dose._id
            };

            const result = await EmailService.sendMissedDoseAlert(user.email, emailData);
            
            if (result.success) {
                logger.info(`📧 Missed dose email sent to ${user.email}`);
            } else {
                logger.warn(`Failed to send missed dose email to ${user.email}:`, result.message);
            }

        } catch (error) {
            logger.error(`Error notifying user ${user.email}:`, error);
        }
    }

    async checkEmergencyNotification(user, medication, dose) {
        try {
            // Check user's settings for emergency notifications
            const userSettings = user.settings || {};
            
            // If user has emergency contacts and missed multiple doses
            if (userSettings.emergencyContacts && userSettings.emergencyContacts.length > 0) {
                const recentMisses = await Dose.countDocuments({
                    userId: user._id,
                    status: 'missed',
                    scheduledTime: {
                        $gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
                    }
                });

                // If user missed 3+ doses in 24 hours, notify emergency contacts
                if (recentMisses >= 3) {
                    await this.notifyEmergencyContacts(user, medication, dose, userSettings.emergencyContacts);
                }
            }

        } catch (error) {
            logger.error('Error checking emergency notification:', error);
        }
    }

    async notifyEmergencyContacts(user, medication, dose, contacts) {
        try {
            const emergencyData = {
                patientName: user.name || user.email.split('@')[0],
                medicationName: medication.name,
                missedTime: dose.scheduledTime.toLocaleTimeString(),
                missedCount: 3 // Minimum threshold reached
            };

            for (const contact of contacts) {
                if (contact.email && contact.notify) {
                    const result = await EmailService.sendEmergencyAlert(contact.email, emergencyData);
                    
                    if (result.success) {
                        logger.info(`🚨 Emergency alert sent to ${contact.email}`);
                    }
                }
            }

        } catch (error) {
            logger.error('Error notifying emergency contacts:', error);
        }
    }

    async checkUpcomingDoses() {
        try {
            const now = new Date();
            const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

            const upcomingDoses = await Dose.find({
                scheduledTime: {
                    $gte: now,
                    $lte: thirtyMinutesFromNow
                },
                status: 'pending',
                reminderSent: { $ne: true }
            }).populate('medicationId').populate('userId');

            logger.debug(`Found ${upcomingDoses.length} upcoming doses to process`);

            for (const dose of upcomingDoses) {
                await this.sendReminder(dose);
            }

            return upcomingDoses.length;

        } catch (error) {
            logger.error('Error checking upcoming doses:', error);
            throw error;
        }
    }

    async sendReminder(dose) {
        try {
            const user = dose.userId;
            const medication = dose.medicationId;

            if (!user || !medication) {
                return;
            }

            const emailData = {
                userName: user.name || user.email.split('@')[0],
                medicationName: medication.name,
                dosage: dose.dosage || medication.dosage,
                scheduledTime: dose.scheduledTime.toLocaleTimeString(),
                doseId: dose._id
            };

            const result = await EmailService.sendReminderEmail(user.email, emailData);
            
            if (result.success) {
                dose.reminderSent = true;
                await dose.save();
                logger.info(`🔔 Reminder sent for dose ${dose._id} to ${user.email}`);
            }

        } catch (error) {
            logger.error(`Error sending reminder for dose ${dose._id}:`, error);
        }
    }

    // New: Get detailed status for API
    getStatus() {
        return {
            service: 'MissedDoseDetector',
            status: this.scheduledTask ? 'ACTIVE' : 'INACTIVE',
            isRunning: this.isRunning,
            lastRun: this.lastRun,
            lastCheckResult: this.lastCheckResult,
            totalChecks: this.totalChecks,
            totalMissedFound: this.totalMissedFound,
            totalRemindersSent: this.totalRemindersSent,
            errorCount: this.errors.length,
            recentErrors: this.errors.slice(-5),
            nextCheck: this.scheduledTask?.nextDate()?.toString() || 'Not scheduled',
            nextReminderCheck: this.reminderTask?.nextDate()?.toString() || 'Not scheduled',
            checkInterval: `${this.checkInterval / 60000} minutes`,
            settings: {
                missedDoseWindow: '15-60 minutes ago',
                emergencyThreshold: '3 missed doses in 24 hours',
                reminderWindow: 'Next 30 minutes'
            }
        };
    }

    // New: Get performance statistics
    getStats() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return {
            last24Hours: {
                checks: this.totalChecks,
                missedDoses: this.totalMissedFound,
                reminders: this.totalRemindersSent,
                errors: this.errors.filter(e => new Date(e.timestamp) > oneDayAgo).length
            },
            uptime: this.lastRun ? Math.floor((now - this.lastRun) / 1000 / 60) : 0, // minutes since last run
            reliability: this.totalChecks > 0 ? 
                ((this.totalChecks - this.errors.length) / this.totalChecks * 100).toFixed(2) + '%' : 
                '0%'
        };
    }

    // New: Get recent activity
    getRecentActivity(limit = 10) {
        return {
            lastChecks: this.lastCheckResult ? [this.lastCheckResult] : [],
            recentErrors: this.errors.slice(-limit),
            upcomingNextCheck: this.scheduledTask?.nextDate() || null
        };
    }

    // Enhanced health check
    async healthCheck() {
        try {
            const now = new Date();
            const isHealthy = this.scheduledTask && this.scheduledTask.task && 
                             this.scheduledTask.task._scheduled === true;
            
            return {
                service: 'MissedDoseDetector',
                status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
                isRunning: this.isRunning,
                lastRun: this.lastRun,
                nextRun: this.scheduledTask?.nextDate() || null,
                uptime: this.lastRun ? Math.floor((now - this.lastRun) / 1000) : 0,
                metrics: {
                    totalChecks: this.totalChecks,
                    missedDosesFound: this.totalMissedFound,
                    remindersSent: this.totalRemindersSent,
                    errorRate: this.errors.length
                },
                timestamp: now
            };
            
        } catch (error) {
            return {
                service: 'MissedDoseDetector',
                status: 'ERROR',
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    // New: Control methods for API
    start() {
        if (this.scheduledTask) {
            this.scheduledTask.start();
            logger.info('MissedDoseDetector started manually');
            return { success: true, message: 'Service started' };
        }
        return { success: false, message: 'Service not initialized' };
    }

    stop() {
        if (this.scheduledTask || this.reminderTask) {
            if (this.scheduledTask) {
                this.scheduledTask.stop();
            }
            if (this.reminderTask) {
                this.reminderTask.stop();
            }
            this.scheduledTask = null;
            this.reminderTask = null;
            logger.info('MissedDoseDetector stopped manually');
            return { success: true, message: 'Service stopped' };
        }
        return { success: false, message: 'Service not initialized' };
    }

    restart() {
        if (this.scheduledTask || this.reminderTask) {
            this.stop();
            this.init();
            logger.info('MissedDoseDetector restarted');
            return { success: true, message: 'Service restarted' };
        }
        return { success: false, message: 'Service not initialized' };
    }

    // New: Force check now (manual trigger)
    async forceCheck() {
        try {
            logger.info('🚀 Force checking missed doses...');
            const result = await this.checkForMissedDoses();
            this.lastRun = new Date();
            this.totalChecks++;
            return {
                success: true,
                message: 'Manual check completed',
                result: result
            };
        } catch (error) {
            return {
                success: false,
                message: 'Manual check failed',
                error: error.message
            };
        }
    }

    // New: Clear error log
    clearErrors() {
        const cleared = this.errors.length;
        this.errors = [];
        logger.info(`Cleared ${cleared} errors from MissedDoseDetector`);
        return {
            success: true,
            cleared: cleared
        };
    }
}

module.exports = new MissedDoseDetector();
