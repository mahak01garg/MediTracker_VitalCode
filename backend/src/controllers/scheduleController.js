// controllers/scheduleController.js
const cron = require('node-cron');
const MissedDoseDetector = require('../services/scheduler//MissedDoseDetector');
const ReminderScheduler = require('../services/scheduler/ReminderScheduler');
const CronJobManager = require('../services/scheduler/cronJobs');

const scheduleController = {
    // Get comprehensive status of all scheduled services
    getCompleteStatus: async (req, res) => {
        try {
            const status = {
                timestamp: new Date().toISOString(),
                serverTime: new Date().toString(),
                services: {},
                system: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    memory: process.memoryUsage(),
                    uptime: process.uptime()
                }
            };

            // MissedDoseDetector status
            try {
                status.services.missedDoseDetector = MissedDoseDetector.getStatus();
            } catch (error) {
                status.services.missedDoseDetector = {
                    error: error.message,
                    status: 'ERROR'
                };
            }

            // ReminderScheduler status
            try {
                status.services.reminderScheduler = ReminderScheduler.getStatus();
            } catch (error) {
                status.services.reminderScheduler = {
                    error: error.message,
                    status: 'ERROR'
                };
            }

            // CronJobManager status
            try {
                status.services.cronJobManager = CronJobManager.getStatus();
            } catch (error) {
                status.services.cronJobManager = {
                    error: error.message,
                    status: 'ERROR'
                };
            }

            // Get all scheduled tasks from node-cron
            const scheduledTasks = cron.getTasks();
            status.scheduledTasks = Array.from(scheduledTasks).map(([taskName, task]) => ({
                name: taskName,
                expression: task.options?.rule?.source || 'Unknown',
                isRunning: task.isRunning(),
                nextExecution: task.nextDate()?.toString() || 'Not scheduled',
                lastExecution: task.lastExecution()?.toString() || 'Never executed'
            }));

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            console.error('Error getting complete schedule status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get schedule status',
                message: error.message
            });
        }
    },

    // Get status for a specific service
    getServiceStatus: async (req, res) => {
        try {
            const { service } = req.params;
            let status;

            switch (service.toLowerCase()) {
                case 'misseddose':
                case 'missed-dose':
                    status = MissedDoseDetector.getStatus();
                    break;
                case 'reminder':
                case 'reminders':
                    status = ReminderScheduler.getStatus();
                    break;
                case 'cronjobs':
                case 'cron':
                    status = CronJobManager.getStatus();
                    break;
                default:
                    return res.status(404).json({
                        success: false,
                        error: `Service ${service} not found`
                    });
            }

            res.json({
                success: true,
                data: status
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: `Failed to get ${req.params.service} status`
            });
        }
    },

    // Control a specific service
    controlService: async (req, res) => {
        try {
            const { service, action } = req.params;
            let result;

            switch (service.toLowerCase()) {
                case 'misseddose':
                    result = await handleMissedDoseAction(action, req.body);
                    break;
                case 'cronjobs':
                    result = await handleCronJobsAction(action, req.body);
                    break;
                case 'reminder':
                    result = await handleReminderAction(action, req.body);
                    break;
                default:
                    return res.status(404).json({
                        success: false,
                        error: `Service ${service} not found`
                    });
            }

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Run a specific job
    runJob: async (req, res) => {
        try {
            const { jobType, jobName } = req.params;
            let result;

            switch (jobType.toLowerCase()) {
                case 'misseddose':
                    if (jobName === 'force-check') {
                        result = await MissedDoseDetector.forceCheck();
                    } else if (jobName === 'upcoming') {
                        result = await MissedDoseDetector.checkUpcomingDoses();
                    }
                    break;
                case 'cronjob':
                    result = await CronJobManager.forceRunJob(jobName);
                    break;
                default:
                    return res.status(404).json({
                        success: false,
                        error: `Job type ${jobType} not found`
                    });
            }

            if (result) {
                res.json({
                    success: true,
                    message: `Job ${jobName} executed successfully`,
                    result
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: `Job ${jobName} not found`
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get statistics
    getStatistics: async (req, res) => {
        try {
            const stats = {
                missedDoseDetector: MissedDoseDetector.getStats(),
                cronJobManager: CronJobManager.getStats(),
                system: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    load: process.cpuUsage()
                }
            };

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get statistics'
            });
        }
    },

    // Get recent errors
    getErrors: async (req, res) => {
        try {
            const errors = {
                missedDoseDetector: MissedDoseDetector.errors || [],
                cronJobManager: CronJobManager.errors || [],
                recent: []
            };

            // Combine and sort errors by timestamp
            const allErrors = [
                ...(MissedDoseDetector.errors || []),
                ...(CronJobManager.errors || [])
            ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            errors.recent = allErrors.slice(0, 20);

            res.json({
                success: true,
                data: errors
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to get errors'
            });
        }
    },

    // Clear errors
    clearErrors: async (req, res) => {
        try {
            const { service } = req.params;
            let result;

            switch (service) {
                case 'misseddose':
                    result = MissedDoseDetector.clearErrors();
                    break;
                case 'cronjobs':
                    result = CronJobManager.clearErrors();
                    break;
                case 'all':
                    const missedResult = MissedDoseDetector.clearErrors();
                    const cronResult = CronJobManager.clearErrors();
                    result = {
                        success: true,
                        missedDoseCleared: missedResult.cleared,
                        cronJobsCleared: cronResult.cleared,
                        totalCleared: missedResult.cleared + cronResult.cleared
                    };
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid service specified'
                    });
            }

            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};

// Helper functions
async function handleMissedDoseAction(action, body) {
    switch (action) {
        case 'start':
            return MissedDoseDetector.start();
        case 'stop':
            return MissedDoseDetector.stop();
        case 'restart':
            return MissedDoseDetector.restart();
        case 'force-check':
            return await MissedDoseDetector.forceCheck();
        case 'clear-errors':
            return MissedDoseDetector.clearErrors();
        default:
            throw new Error(`Invalid action: ${action}`);
    }
}

async function handleCronJobsAction(action, body) {
    switch (action) {
        case 'initialize':
            CronJobManager.initialize();
            return { success: true, message: 'CronJobManager initialized' };
        case 'start':
            return CronJobManager.startJob(body.jobName);
        case 'stop':
            return CronJobManager.stopJob(body.jobName);
        case 'clear-errors':
            return CronJobManager.clearErrors();
        default:
            throw new Error(`Invalid action: ${action}`);
    }
}

async function handleReminderAction(action, body) {
    switch (action) {
        case 'test':
            // Add test functionality here
            return { success: true, message: 'Test functionality not implemented yet' };
        default:
            throw new Error(`Invalid action: ${action}`);
    }
}

module.exports = scheduleController;