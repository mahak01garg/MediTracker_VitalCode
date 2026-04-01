// routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const {auth,firebaseAuth} = require('../middleware/auth');

const normalizeScheduleDays = (dayValue) => {
  if (dayValue === 'everyday') {
    return ['everyday'];
  }

  if (Array.isArray(dayValue)) {
    return dayValue.map((day) => String(day).toLowerCase());
  }

  if (typeof dayValue === 'string') {
    return [dayValue.toLowerCase()];
  }

  return [];
};

const getTodayScheduleKeys = (date) => {
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const fullDayNames = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
  ];

  const dayIndex = date.getDay();
  return [dayNames[dayIndex], fullDayNames[dayIndex]];
};

// All schedule routes require authentication
router.use(auth);
// Get complete status of all services
router.get('/status', scheduleController.getCompleteStatus);

// Get status for specific service
router.get('/status/:service', scheduleController.getServiceStatus);

// Control a service
router.post('/control/:service/:action', scheduleController.controlService);

// Run a specific job
router.post('/run/:jobType/:jobName', scheduleController.runJob);

// Get statistics
router.get('/stats', scheduleController.getStatistics);

// Get errors
router.get('/errors', scheduleController.getErrors);

// Clear errors
router.post('/clear-errors/:service', scheduleController.clearErrors);

// Add these routes to your existing medicationRoutes.js

// Generate today's doses for all active medications
router.post('/generate-today-doses', auth, async (req, res) => {
  try {
    const Dose = require('../models/Dose');
    const Medication = require('../models/Medication');
    
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayScheduleKeys = getTodayScheduleKeys(today);
    
    // Get all active medications for the user
    const medications = await Medication.find({ 
      userId, 
      isActive: true 
    });
    
    let generatedCount = 0;
    let existingCount = 0;
    let eligibleCount = 0;
    
    for (const medication of medications) {
      if (medication.schedule) {
        // Generate doses for today based on schedule
        for (const schedule of medication.schedule) {
          const scheduleDays = normalizeScheduleDays(schedule.day);
          const appliesToday =
            scheduleDays.includes('everyday') ||
            scheduleDays.some((day) => todayScheduleKeys.includes(day));

          if (!appliesToday) {
            continue;
          }

          for (const time of schedule.times) {
            const [hours, minutes] = time.split(':').map(Number);
            const scheduledTime = new Date(today);
            scheduledTime.setHours(hours, minutes, 0, 0);
            
            // Create any missing dose for today, even if the scheduled time
            // has already passed, so the user can still log it as taken/missed.
            if (scheduledTime >= today && scheduledTime < tomorrow) {
              eligibleCount++;

              const existingDose = await Dose.findOne({
                userId,
                medicationId: medication._id,
                scheduledTime
              });

              if (existingDose) {
                existingCount++;
                continue;
              }

              const dose = new Dose({
                userId,
                medicationId: medication._id,
                scheduledTime,
                dosage: medication.dosage,
                status: 'pending'
              });
              
              await dose.save();
              generatedCount++;
            }
          }
        }
      }
    }
    
    res.json({
      success: true,
      message:
        generatedCount > 0
          ? `Generated ${generatedCount} doses for today`
          : eligibleCount > 0
          ? "All today's doses are already available"
          : "No doses are scheduled for today",
      count: generatedCount,
      existingCount,
      eligibleCount
    });
    
  } catch (error) {
    console.error('Error generating today doses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate doses'
    });
  }
});

// Check for missed doses
router.post('/check-missed', auth, async (req, res) => {
  try {
    const Dose = require('../models/Dose');
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    
    // Find doses scheduled between 15 minutes to 1 hour ago that are still pending
    const missedDoses = await Dose.find({
      userId: req.user._id,
      status: 'pending',
      scheduledTime: {
        $gte: oneHourAgo,
        $lte: fifteenMinutesAgo
      }
    }).populate('medicationId', 'name');
    
    // Mark them as missed
    for (const dose of missedDoses) {
      dose.status = 'missed';
      dose.missedAt = new Date();
      await dose.save();
    }
    
    res.json({
      success: true,
      message: `Found ${missedDoses.length} missed doses`,
      missed: missedDoses.length,
      doses: missedDoses
    });
    
  } catch (error) {
    console.error('Error checking missed doses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check missed doses'
    });
  }
});

// Generate daily report
router.get('/reports/daily', auth, async (req, res) => {
  try {
    const Dose = require('../models/Dose');
    const Medication = require('../models/Medication');
    
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's doses
    const doses = await Dose.find({
      userId,
      scheduledTime: { $gte: today, $lt: tomorrow }
    }).populate('medicationId', 'name dosage');
    
    const taken = doses.filter(d => d.status === 'taken').length;
    const missed = doses.filter(d => d.status === 'missed').length;
    const pending = doses.filter(d => d.status === 'pending').length;
    const adherenceRate = doses.length > 0 ? ((taken / doses.length) * 100).toFixed(1) : 100;
    
    // Get active medications count
    const activeMeds = await Medication.countDocuments({ userId, isActive: true });
    
    res.json({
      success: true,
      message: 'Daily report generated',
      report: {
        date: today.toDateString(),
        activeMedications: activeMeds,
        totalDoses: doses.length,
        taken,
        missed,
        pending,
        adherenceRate: `${adherenceRate}%`,
        summary: `You took ${taken} out of ${doses.length} doses today (${adherenceRate}% adherence)`
      }
    });
    
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});
module.exports = router;
