const Medication = require('../models/Medication');
const Dose = require('../models/Dose');
const Reminder = require('../models/Reminder');
const scheduler = require('../services/scheduler/ReminderScheduler');
const User = require('../models/User');
const Reward = require('../models/Reward');
const { deleteDosesForMedication } = require('../utils/doseUtils');

exports.createMedication = async (req, res) => {
    try {
        console.log('=== CREATE MEDICATION DEBUG ===');
        console.log('Request body:', req.body);
        console.log('startDate from frontend:', req.body.startDate);
        console.log('typeof startDate:', typeof req.body.startDate);
        console.log('User ID:', req.user.id);
        console.log('=============================');
        const {
            name,
            dosage,
            frequency,
            schedule,
            startDate,
            endDate,
            instructions,
            notes
        } = req.body;

        const medication = new Medication({
            userId: req.user.id,
            name,
            dosage,
            frequency,
            schedule:schedule||[],
            startDate:startDate ? new Date(startDate) : new Date(),
            endDate:endDate ? new Date(endDate) : null,  
            instructions,
            notes
        });
        console.log('Medication object (before save):', medication);
        console.log('startDate type after conversion:', typeof medication.startDate);
        console.log('startDate value:', medication.startDate);

        await medication.save();
        console.log('✅ Medication saved successfully:', medication._id);
        // Generate doses for the medication
        await generateDosesForMedication(medication);

        res.status(201).json({
            message: 'Medication created successfully',
            medication
        });
    } catch (error) {
        console.error('Create medication error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getMedications = async (req, res) => {
    try {
        const { active } = req.query;
        let query = { userId: req.user.id };
        
        if (active !== undefined) {
            query.isActive = active === 'true';
        }

        const medications = await Medication.find(query)
            .sort({ createdAt: -1 });

        // Get upcoming doses for each medication
        const medicationsWithDoses = await Promise.all(
            medications.map(async (med) => {
                const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

const endOfToday = new Date();
endOfToday.setHours(23, 59, 59, 999);

const upcomingDoses = await Dose.find({
  medicationId: med._id,
  status: 'pending',
  scheduledTime: {
    $gte: startOfToday,
    $lte: endOfToday
  }
}).sort({ scheduledTime: 1 });


                return {
                    ...med.toObject(),
                    upcomingDoses
                };
            })
        );

        res.json( medicationsWithDoses );
    } catch (error) {
        console.error('Get medications error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getTodayDoses = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const doses = await Dose.find({
            userId: req.user.id,
            scheduledTime: { $gte: today, $lt: tomorrow },
            status: { $in: ['pending', 'snoozed'] }
        })
        .populate('medicationId', 'name dosage instructions')
        .sort({ scheduledTime: 1 });

        res.json({ doses });
    } catch (error) {
        console.error('Get today doses error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateMedication=async(req,res)=>{
    try{
        const {id}=req.params;
        const {
            name,
            dosage,
            frequency,
            schedule,
            startDate,
            endDate,
            instructions,
            notes
        }=req.body;
        const medication=await Medication.findOne({
            _id:id,
            userId:req.user.id
        });
        if(!medication){
            return res.status(404).json({error:'Medication not found'});
        }
        if(name!=undefined)medication.name=name;
        if(dosage!=undefined)medication.dosage=dosage;
        if(frequency!=undefined)medication.frequency=frequency;
        if(schedule!=undefined)medication.schedule=schedule;
        if(startDate!=undefined)medication.startDate=new Date(startDate);
        if(endDate!=undefined)medication.endDate=endDate?new Date(endDate):null;
        if (instructions != undefined) medication.instructions = instructions;
        if (notes != undefined) medication.notes = notes;

        await medication.save();
        await deleteDosesForMedication(medication._id);
        await generateDosesForMedication(medication);
         res.json({
            message: 'Medication updated successfully',
            medication
        });

    }catch (error) {
        console.error('Update medication error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

exports.deleteMedication = async (req, res) => {
    try{
        const id=req.params.id;
        const medication=await Medication.findOneAndDelete({
            _id:id,
            userId:req.user.id
        })
        if(!medication){
            return res.status(404).json({
                error:'Medication not found'
            })
        }
        await deleteDosesForMedication(medication._id);
        res.json({
            message:'Medication deleted successfully'
        })
        console.log("Medication deleted successfully ");
    }catch(error){
        console.error('Delete medication error:',error);
        res.status(500).json({
            error:'Server error'
        })
    }
   
};


exports.generateDoses = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.medicationId);
    if (!medication) {
      return res.status(404).json({ success: false, error: 'Medication not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const fullDayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayKeys = [dayNames[today.getDay()], fullDayNames[today.getDay()]];
    
    const newDoses = [];

    for (const schedule of medication.schedule) {
      const scheduleDays = Array.isArray(schedule.day)
        ? schedule.day.map((day) => String(day).toLowerCase())
        : [String(schedule.day).toLowerCase()];
      const appliesToday =
        scheduleDays.includes('everyday') ||
        scheduleDays.some((day) => todayKeys.includes(day));

      if (!appliesToday) {
        continue;
      }

      for (const time of schedule.times) {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledTime = new Date(today);
        scheduledTime.setHours(hours, minutes, 0, 0);

        // Create any missing dose for today's schedule, even if the time
        // has already passed, so the user can still mark it taken/missed.
        if (scheduledTime >= today && scheduledTime < tomorrow) {
          
          // Do not regenerate a dose for the same medication/time,
          // even if the previous one was already taken or missed.
          const existingDose = await Dose.findOne({
            userId: req.user._id,
            medicationId: medication._id,
            scheduledTime
          });
          
          if (!existingDose) {
            const dose = new Dose({
              userId: req.user._id,
              medicationId: medication._id,
              scheduledTime,
              dosage: medication.dosage,
              status: 'pending'
            });
            
            await dose.save();
            newDoses.push(dose);
          }
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Doses generated successfully',
      count: newDoses.length,
      doses: newDoses
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDoseHistory = async (req, res) => {
    try {
        const { period } = req.params; // day, week, month
        
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        switch (period) {
            case 'day':
                startDate.setDate(startDate.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            default:
                return res.status(400).json({ error: 'Invalid period. Use: day, week, month' });
        }
        
        const doses = await Dose.find({
            userId: req.user.id,
            scheduledTime: { $gte: startDate, $lte: endDate }
        })
        .populate('medicationId', 'name dosage')
        .sort({ scheduledTime: -1 });
        
        const stats = {
            total: doses.length,
            taken: doses.filter(d => d.status === 'taken').length,
            missed: doses.filter(d => d.status === 'missed').length,
            pending: doses.filter(d => d.status === 'pending').length,
            adherence: doses.length > 0 
                ? Math.round((doses.filter(d => d.status === 'taken').length / doses.length) * 100)
                : 100
        };
        
        res.json({
            period,
            startDate,
            endDate,
            doses,
            stats
        });
        
    } catch (error) {
        console.error('Get dose history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// For line 20 in routes
exports.getWeekDoses = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekLater = new Date(today);
        weekLater.setDate(weekLater.getDate() + 7);
        
        const doses = await Dose.find({
            userId: req.user.id,
            scheduledTime: { $gte: today, $lt: weekLater }
        })
        .populate('medicationId', 'name dosage instructions')
        .sort({ scheduledTime: 1 });
        
        // Group by day
        const dosesByDay = {};
        doses.forEach(dose => {
            const day = dose.scheduledTime.toISOString().split('T')[0];
            if (!dosesByDay[day]) {
                dosesByDay[day] = [];
            }
            dosesByDay[day].push(dose);
        });
        
        res.json({
            period: 'week',
            startDate: today,
            endDate: weekLater,
            totalDoses: doses.length,
            dosesByDay,
            doses
        });
        
    } catch (error) {
        console.error('Get week doses error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


exports.updateDoseStatus = async (req, res) => {
    try {
        const { doseId } = req.params;
        const { status, notes } = req.body;

        const dose = await Dose.findOne({
            _id: doseId,
            userId: req.userId
        });

        if (!dose) {
            return res.status(404).json({ error: 'Dose not found' });
        }

        const oldStatus = dose.status;
        dose.status = status;
        dose.actualTime = status === 'taken' ? new Date() : null;
        if (notes) dose.notes = notes;

        await dose.save();

        // Update streak if dose was taken
        if (status === 'taken') {
            await updateStreak(req.userId);
        }

        // Award points for taken dose
        if (status === 'taken') {
            await awardPoints(req.userId, 'dose_taken', 10);
        }

        res.json({
            message: 'Dose status updated successfully',
            dose
        });
    } catch (error) {
        console.error('Update dose status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Helper function to generate doses for a medication
async function generateDosesForMedication(medication) {
    const doses = [];
    const startDate = new Date(medication.startDate);
    const endDate = medication.endDate ? new Date(medication.endDate) : null;

    const MAX_DAYS = 30;
    const effectiveEndDate =
        endDate || new Date(startDate.getTime() + MAX_DAYS * 24 * 60 * 60 * 1000);

    medication.schedule.forEach(scheduleItem => {

        // ✅ Normalize day → array of day indexes
        let dayIndexes = [];

        if (scheduleItem.day === 'everyday') {
            dayIndexes = [0, 1, 2, 3, 4, 5, 6];
        } else {
            const days = Array.isArray(scheduleItem.day)
                ? scheduleItem.day
                : [scheduleItem.day];

            dayIndexes = days
                .map(d => getDayIndex(d))
                .filter(index => index !== -1);
        }

        scheduleItem.times.forEach(time => {
            const [hours, minutes] = time.split(':').map(Number);
            let currentDate = new Date(startDate);

            while (currentDate <= effectiveEndDate) {
                if (dayIndexes.includes(currentDate.getDay())) {
                    const doseTime = new Date(currentDate);
                    doseTime.setHours(hours, minutes, 0, 0);

                    if (doseTime >= startDate) {
                        doses.push({
                            userId: medication.userId,
                            medicationId: medication._id,
                            scheduledTime: doseTime,
                            status: 'pending'
                        });
                    }
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
    });

    // ✅ Save doses + schedule reminders
    if (doses.length > 0) {
        const savedDoses = await Dose.insertMany(doses);

        savedDoses.forEach(dose => {
            scheduler.scheduleReminder(dose);
        });
    }
}

function getDayIndex(day) {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    if (Array.isArray(day)) {
        day = day[0]; // safety fallback
    }

    if (typeof day !== 'string') return -1;

    return days.indexOf(day.toLowerCase());
}

async function updateStreak(userId) {
    const user = await User.findById(userId);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!user.streaks.lastDoseTaken) {
        user.streaks.current = 1;
    } else {
        const lastTaken = new Date(user.streaks.lastDoseTaken);
        const diffDays = Math.floor((now - lastTaken) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            user.streaks.current += 1;
        } else if (diffDays > 1) {
            user.streaks.current = 1;
        }
    }

    user.streaks.lastDoseTaken = now;
    user.streaks.longest = Math.max(user.streaks.longest, user.streaks.current);
    
    await user.save();

    // Award badge for streaks
    if (user.streaks.current % 7 === 0) {
        await awardBadge(userId, `7_day_streak_${user.streaks.current / 7}`);
    }
}

async function awardPoints(userId, type, points) {
    const user = await User.findById(userId);
    user.rewardPoints += points;
    await user.save();

    // Create reward record
    const reward = new Reward({
        userId,
        points,
        type,
        description: `${points} points for ${type.replace('_', ' ')}`
    });
    await reward.save();
}

async function awardBadge(userId, badgeName) {
    const user = await User.findById(userId);
    const badgeDescriptions = {
        '7_day_streak_1': '7 Day Streak - Perfect week!',
        '7_day_streak_2': '14 Day Streak - Two weeks strong!',
        'medication_completed': 'Medication Completed - Course finished!',
        'perfect_month': 'Perfect Month - No missed doses!'
    };

    const badgeExists = user.badges.some(b => b.name === badgeName);
    if (!badgeExists) {
        user.badges.push({
            name: badgeName,
            earnedAt: new Date(),
            description: badgeDescriptions[badgeName] || badgeName
        });
        await user.save();
    }
}
