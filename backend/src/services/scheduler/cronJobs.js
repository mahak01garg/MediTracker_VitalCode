const cron = require('node-cron');
const ReminderScheduler = require('./ReminderScheduler');
const MissedDoseDetector = require('./MissedDoseDetector');
const logger = require('../../utils/logger');

class CronJobManager {
    constructor() {
        this.scheduledJobs = [];
        this.jobStats = {
            dailyReports: { runs: 0, lastRun: null, errors: 0 },
            weeklySummaries: { runs: 0, lastRun: null, errors: 0 },
            cleanup: { runs: 0, lastRun: null, errors: 0 },
            healthInsights: { runs: 0, lastRun: null, errors: 0 }
        };
        this.errors = [];
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) {
            logger.warn('CronJobManager already initialized');
            return;
        }

        try {
            // Clear existing jobs
            this.scheduledJobs.forEach(job => job.stop());
            this.scheduledJobs = [];

            // 1. Daily adherence report (runs at 9 PM daily)
            const dailyReportJob = cron.schedule('0 21 * * *', async () => {
                try {
                    logger.info('Starting daily adherence report generation...');
                    await this.generateDailyAdherenceReports();
                    this.jobStats.dailyReports.runs++;
                    this.jobStats.dailyReports.lastRun = new Date();
                    logger.info('Daily adherence report generation completed');
                } catch (error) {
                    this.jobStats.dailyReports.errors++;
                    this.errors.push({
                        timestamp: new Date(),
                        job: 'dailyAdherenceReport',
                        error: error.message
                    });
                    logger.error('Daily report generator error:', error);
                }
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata",
                name: 'daily-adherence-report'
            });
            this.scheduledJobs.push(dailyReportJob);

            // 2. Weekly summary (runs every Sunday at 10 PM)
            const weeklySummaryJob = cron.schedule('0 22 * * 0', async () => {
                try {
                    logger.info('Starting weekly summary generation...');
                    await this.generateWeeklySummaries();
                    this.jobStats.weeklySummaries.runs++;
                    this.jobStats.weeklySummaries.lastRun = new Date();
                    logger.info('Weekly summary generation completed');
                } catch (error) {
                    this.jobStats.weeklySummaries.errors++;
                    this.errors.push({
                        timestamp: new Date(),
                        job: 'weeklySummary',
                        error: error.message
                    });
                    logger.error('Weekly summary generator error:', error);
                }
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata",
                name: 'weekly-summary'
            });
            this.scheduledJobs.push(weeklySummaryJob);

            // 3. Cleanup old notifications (runs daily at midnight)
            const cleanupJob = cron.schedule('0 0 * * *', async () => {
                try {
                    logger.info('Starting data cleanup...');
                    await this.cleanupOldData();
                    this.jobStats.cleanup.runs++;
                    this.jobStats.cleanup.lastRun = new Date();
                    logger.info('Data cleanup completed');
                } catch (error) {
                    this.jobStats.cleanup.errors++;
                    this.errors.push({
                        timestamp: new Date(),
                        job: 'cleanup',
                        error: error.message
                    });
                    logger.error('Cleanup job error:', error);
                }
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata",
                name: 'data-cleanup'
            });
            this.scheduledJobs.push(cleanupJob);

            // 4. Health insights generation (runs at 3 AM daily)
            const healthInsightsJob = cron.schedule('0 3 * * *', async () => {
                try {
                    logger.info('Starting health insights generation...');
                    await this.generateHealthInsights();
                    this.jobStats.healthInsights.runs++;
                    this.jobStats.healthInsights.lastRun = new Date();
                    logger.info('Health insights generation completed');
                } catch (error) {
                    this.jobStats.healthInsights.errors++;
                    this.errors.push({
                        timestamp: new Date(),
                        job: 'healthInsights',
                        error: error.message
                    });
                    logger.error('Health insights generator error:', error);
                }
            }, {
                scheduled: true,
                timezone: "Asia/Kolkata",
                name: 'health-insights'
            });
            this.scheduledJobs.push(healthInsightsJob);

            this.isInitialized = true;
            logger.info(`✅ CronJobManager initialized with ${this.scheduledJobs.length} scheduled jobs`);

        } catch (error) {
            logger.error('Failed to initialize CronJobManager:', error);
            this.errors.push({
                timestamp: new Date(),
                job: 'initialization',
                error: error.message
            });
        }
    }

    getStatus() {
        return {
            service: 'CronJobManager',
            status: this.isInitialized ? 'ACTIVE' : 'INACTIVE',
            totalJobs: this.scheduledJobs.length,
            initializedAt: this.isInitialized ? new Date() : null,
            jobStats: this.jobStats,
            errorCount: this.errors.length,
            recentErrors: this.errors.slice(-5),
            scheduledJobs: this.scheduledJobs.map(job => ({
                name: job.options?.name || 'unnamed',
                expression: job.cronExpression || job.options?.rule?.source,
                isRunning: job.task && job.task._scheduled === true,
                nextExecution: job.nextDate()?.toString() || 'Not scheduled'
            }))
        };
    }

    getStats() {
        const totalRuns = Object.values(this.jobStats).reduce((sum, stat) => sum + stat.runs, 0);
        const totalErrors = Object.values(this.jobStats).reduce((sum, stat) => sum + stat.errors, 0);
        
        return {
            summary: {
                totalJobs: this.scheduledJobs.length,
                totalRuns: totalRuns,
                totalErrors: totalErrors,
                errorRate: totalRuns > 0 ? ((totalErrors / totalRuns) * 100).toFixed(2) + '%' : '0%'
            },
            individualStats: this.jobStats
        };
    }

    async forceRunJob(jobName) {
        try {
            switch(jobName) {
                case 'dailyReport':
                    await this.generateDailyAdherenceReports();
                    break;
                case 'weeklySummary':
                    await this.generateWeeklySummaries();
                    break;
                case 'cleanup':
                    await this.cleanupOldData();
                    break;
                case 'healthInsights':
                    await this.generateHealthInsights();
                    break;
                default:
                    throw new Error(`Unknown job: ${jobName}`);
            }
            
            return {
                success: true,
                message: `Job ${jobName} executed successfully`,
                timestamp: new Date()
            };
        } catch (error) {
            this.errors.push({
                timestamp: new Date(),
                job: `force-${jobName}`,
                error: error.message
            });
            throw error;
        }
    }

    startJob(jobName) {
        const job = this.scheduledJobs.find(j => j.options?.name === jobName);
        if (job) {
            job.start();
            logger.info(`Started job: ${jobName}`);
            return { success: true, message: `Job ${jobName} started` };
        }
        return { success: false, message: `Job ${jobName} not found` };
    }

    stopJob(jobName) {
        const job = this.scheduledJobs.find(j => j.options?.name === jobName);
        if (job) {
            job.stop();
            logger.info(`Stopped job: ${jobName}`);
            return { success: true, message: `Job ${jobName} stopped` };
        }
        return { success: false, message: `Job ${jobName} not found` };
    }

    clearErrors() {
        const clearedCount = this.errors.length;
        this.errors = [];
        logger.info(`Cleared ${clearedCount} errors from CronJobManager`);
        return {
            success: true,
            cleared: clearedCount
        };
    }

    // Existing methods from your cronJobs.js (keeping them as-is)
    async generateDailyAdherenceReports() {
        // Your existing implementation
        try {
            const User = require('../../models/User');
            const Dose = require('../../models/Dose');
            const emailService = require('../notification/EmailService');

            const users = await User.find({
                'notificationPreferences.email': true
            });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            for (const user of users) {
                try {
                    // Get today's doses
                    const doses = await Dose.find({
                        userId: user._id,
                        scheduledTime: { $gte: today, $lt: tomorrow }
                    }).populate('medicationId');

                    const taken = doses.filter(d => d.status === 'taken').length;
                    const missed = doses.filter(d => d.status === 'missed').length;
                    const pending = doses.filter(d => d.status === 'pending' || d.status === 'snoozed').length;

                    // Only send report if there were doses today
                    if (doses.length > 0) {
                        const adherenceRate = doses.length > 0 
                            ? ((taken / doses.length) * 100).toFixed(1)
                            : '100.0';

                        const html = `
                            <h2>📊 Daily Adherence Report</h2>
                            <p>Hi ${user.name},</p>
                            <p>Here's your medication adherence report for ${today.toDateString()}:</p>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <h3>Today's Summary</h3>
                                <p>✅ Taken: ${taken} doses</p>
                                <p>❌ Missed: ${missed} doses</p>
                                <p>⏰ Pending: ${pending} doses</p>
                                <p>📈 Adherence Rate: ${adherenceRate}%</p>
                            </div>
                            
                            <p>Keep up the good work! 🎉</p>
                            <p><a href="${process.env.FRONTEND_URL}/dashboard">View Full Dashboard</a></p>
                        `;

                        await emailService.sendEmail(
                            user.email,
                            `📊 Daily Adherence Report - ${today.toDateString()}`,
                            html
                        );

                        logger.info(`Sent daily report to ${user.email}`);
                    }
                } catch (error) {
                    logger.error(`Failed to send daily report for user ${user.email}:`, error);
                }
            }
            return { success: true, usersProcessed: users.length };
        } catch (error) {
            logger.error('Daily report generation error:', error);
            throw error;
        }
    }

    async generateWeeklySummaries() {
        // Your existing implementation
        try {
            const User = require('../../models/User');
            const Dose = require('../../models/Dose');
            const emailService = require('../notification/EmailService');

            const users = await User.find({
                'notificationPreferences.email': true
            });

            const endDate = new Date();
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 7);

            for (const user of users) {
                try {
                    // Get doses for the past week
                    const doses = await Dose.find({
                        userId: user._id,
                        scheduledTime: { $gte: startDate, $lte: endDate }
                    });

                    if (doses.length > 0) {
                        const taken = doses.filter(d => d.status === 'taken').length;
                        const adherenceRate = ((taken / doses.length) * 100).toFixed(1);

                        // Calculate streak
                        const streak = user.streaks.current;

                        const html = `
                            <h2>📈 Weekly Medication Summary</h2>
                            <p>Hi ${user.name},</p>
                            <p>Here's your weekly medication summary (${startDate.toDateString()} to ${endDate.toDateString()}):</p>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                <h3>Week at a Glance</h3>
                                <p>✅ Doses Taken: ${taken}/${doses.length}</p>
                                <p>📈 Weekly Adherence: ${adherenceRate}%</p>
                                <p>🔥 Current Streak: ${streak} days</p>
                                <p>🏆 Reward Points: ${user.rewardPoints}</p>
                            </div>
                            
                            <p>${this.getEncouragementMessage(parseFloat(adherenceRate))}</p>
                            
                            <p><a href="${process.env.FRONTEND_URL}/reports/weekly">View Detailed Report</a></p>
                        `;

                        await emailService.sendEmail(
                            user.email,
                            `📈 Weekly Medication Summary - Week of ${startDate.toDateString()}`,
                            html
                        );

                        logger.info(`Sent weekly summary to ${user.email}`);
                    }
                } catch (error) {
                    logger.error(`Failed to send weekly summary for user ${user.email}:`, error);
                }
            }
            return { success: true, usersProcessed: users.length };
        } catch (error) {
            logger.error('Weekly summary generation error:', error);
            throw error;
        }
    }

    async cleanupOldData() {
        // Your existing implementation
        try {
            const Dose = require('../../models/Dose');
            const Reminder = require('../../models/Reminder');
            const HealthEntry = require('../../models/HealthEntry');

            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            // Archive completed doses older than 90 days
            const archivedDoses = await Dose.find({
                status: { $in: ['taken', 'missed'] },
                scheduledTime: { $lt: ninetyDaysAgo }
            }).limit(1000);

            // In production, you would archive these to a separate collection
            // For now, we'll just delete them
            if (archivedDoses.length > 0) {
                await Dose.deleteMany({
                    _id: { $in: archivedDoses.map(d => d._id) }
                });
                logger.info(`Archived ${archivedDoses.length} old doses`);
            }

            // Cleanup old reminders
            const oldReminders = await Reminder.deleteMany({
                createdAt: { $lt: ninetyDaysAgo }
            });
            logger.info(`Cleaned up ${oldReminders.deletedCount} old reminders`);

            logger.info('Cleanup completed successfully');
            return { 
                success: true, 
                dosesArchived: archivedDoses.length,
                remindersCleaned: oldReminders.deletedCount 
            };
        } catch (error) {
            logger.error('Cleanup error:', error);
            throw error;
        }
    }

    async generateHealthInsights() {
        // Your existing implementation
        try {
            const User = require('../../models/User');
            const HealthEntry = require('../../models/HealthEntry');
            const Dose = require('../../models/Dose');
            const emailService = require('../notification/EmailService');

            // Get users with health tracking enabled
            const users = await User.find({
                'notificationPreferences.email': true
            }).limit(50); // Limit to avoid overwhelming the system

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            for (const user of users) {
                try {
                    // Get health entries from last 30 days
                    const healthEntries = await HealthEntry.find({
                        userId: user._id,
                        date: { $gte: thirtyDaysAgo }
                    }).sort({ date: 1 });

                    // Get medication adherence for same period
                    const doses = await Dose.find({
                        userId: user._id,
                        scheduledTime: { $gte: thirtyDaysAgo }
                    });

                    if (healthEntries.length >= 5 && doses.length > 0) {
                        // Generate insights
                        const insights = await this.generateUserInsights(user, healthEntries, doses);
                        
                        if (insights) {
                            const html = `
                                <h2>🧠 Health Insights</h2>
                                <p>Hi ${user.name},</p>
                                <p>Here are some insights based on your health data from the past 30 days:</p>
                                
                                <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                                    <h3>📊 Key Insights</h3>
                                    ${insights.map(insight => `<p>${insight}</p>`).join('')}
                                </div>
                                
                                <p>Continue tracking your health to get more personalized insights!</p>
                                <p><a href="${process.env.FRONTEND_URL}/health/insights">View More Insights</a></p>
                            `;

                            await emailService.sendEmail(
                                user.email,
                                '🧠 Your Monthly Health Insights',
                                html
                            );

                            logger.info(`Sent health insights to ${user.email}`);
                        }
                    }
                } catch (error) {
                    logger.error(`Failed to generate insights for user ${user.email}:`, error);
                }
            }
            return { success: true, usersProcessed: users.length };
        } catch (error) {
            logger.error('Health insights generation error:', error);
            throw error;
        }
    }

    async generateUserInsights(user, healthEntries, doses) {
        const insights = [];

        // Calculate adherence rate
        const takenDoses = doses.filter(d => d.status === 'taken').length;
        const adherenceRate = doses.length > 0 
            ? (takenDoses / doses.length * 100).toFixed(1)
            : 0;

        // Analyze blood pressure trends
        const bpEntries = healthEntries.filter(e => e.bloodPressure);
        if (bpEntries.length >= 3) {
            const avgSystolic = bpEntries.reduce((sum, e) => sum + e.bloodPressure.systolic, 0) / bpEntries.length;
            const avgDiastolic = bpEntries.reduce((sum, e) => sum + e.bloodPressure.diastolic, 0) / bpEntries.length;
            
            if (avgSystolic > 130 || avgDiastolic > 85) {
                insights.push(`⚠️ Your average blood pressure (${avgSystolic.toFixed(0)}/${avgDiastolic.toFixed(0)}) is elevated. Consider discussing this with your healthcare provider.`);
            } else {
                insights.push(`✅ Your average blood pressure (${avgSystolic.toFixed(0)}/${avgDiastolic.toFixed(0)}) is within healthy range.`);
            }
        }

        // Correlation between adherence and health
        if (adherenceRate < 80 && bpEntries.length > 0) {
            insights.push(`📉 Your medication adherence is ${adherenceRate}%. Better adherence may improve your health outcomes.`);
        } else if (adherenceRate >= 95) {
            insights.push(`🎉 Excellent! Your ${adherenceRate}% adherence rate shows great consistency. Keep it up!`);
        }

        // Weight trend
        const weightEntries = healthEntries.filter(e => e.weight);
        if (weightEntries.length >= 2) {
            const weightChange = weightEntries[weightEntries.length - 1].weight - weightEntries[0].weight;
            if (Math.abs(weightChange) > 2) {
                insights.push(`⚖️ Your weight has ${weightChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(weightChange).toFixed(1)} kg over the past month.`);
            }
        }

        return insights;
    }

    getEncouragementMessage(adherenceRate) {
        if (adherenceRate >= 95) {
            return "Outstanding adherence! You're doing an amazing job managing your medications. 🏆";
        } else if (adherenceRate >= 85) {
            return "Great job! You're doing well with your medication routine. Keep up the good work! 💪";
        } else if (adherenceRate >= 70) {
            return "You're making progress! Consider setting additional reminders to improve your adherence. ⏰";
        } else {
            return "Let's work on improving your medication adherence. Consistency is key to better health. Consider connecting with a caregiver for support. ❤️";
        }
    }
}

// Export singleton instance
module.exports = new CronJobManager();