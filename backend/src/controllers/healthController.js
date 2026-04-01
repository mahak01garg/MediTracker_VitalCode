const HealthEntry = require('../models/HealthEntry');
const Dose = require('../models/Dose');
const User = require('../models/User');
const { RewardService } = require('../services/reward');
const rewardService = new RewardService();


exports.createHealthEntry = async (req, res) => {
    try {
        const {
            date,
            bloodPressure,
            bloodSugar,
            weight,
            temperature,
            heartRate,
            notes,
            medicationTaken
        } = req.body;

        // Check if entry already exists for this date
        const existingEntry = await HealthEntry.findOne({
            userId: req.userId,
            date: new Date(date)
        });

        if (existingEntry) {
            return res.status(400).json({ 
                error: 'Health entry already exists for this date' 
            });
        }

        const healthEntry = new HealthEntry({
            userId: req.userId,
            date: new Date(date),
            bloodPressure,
            bloodSugar,
            weight,
            temperature,
            heartRate,
            notes,
            medicationTaken
        });

        await healthEntry.save();

        // Award points for logging health
        await awardPoints(req.userId, 'health_log', 5);

        res.status(201).json({
            message: 'Health entry created successfully',
            entry: healthEntry
        });
    } catch (error) {
        console.error('Create health entry error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getHealthEntries = async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            page = 1, 
            limit = 20 
        } = req.query;

        const query = { userId: req.userId };
        
        // Date filtering
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [entries, total] = await Promise.all([
            HealthEntry.find(query)
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            HealthEntry.countDocuments(query)
        ]);

        res.json({
            entries,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get health entries error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getHealthEntry = async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await HealthEntry.findOne({
            _id: id,
            userId: req.userId
        });

        if (!entry) {
            return res.status(404).json({ error: 'Health entry not found' });
        }

        res.json({ entry });
    } catch (error) {
        console.error('Get health entry error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateHealthEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const entry = await HealthEntry.findOne({
            _id: id,
            userId: req.userId
        });

        if (!entry) {
            return res.status(404).json({ error: 'Health entry not found' });
        }

        // Update fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] !== undefined) {
                entry[key] = updateData[key];
            }
        });

        await entry.save();

        res.json({
            message: 'Health entry updated successfully',
            entry
        });
    } catch (error) {
        console.error('Update health entry error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteHealthEntry = async (req, res) => {
    try {
        const { id } = req.params;

        const entry = await HealthEntry.findOneAndDelete({
            _id: id,
            userId: req.userId
        });

        if (!entry) {
            return res.status(404).json({ error: 'Health entry not found' });
        }

        res.json({
            message: 'Health entry deleted successfully'
        });
    } catch (error) {
        console.error('Delete health entry error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAdherenceAnalytics = async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const now = new Date();
        let startDate;

        switch (period) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'quarter':
                startDate = new Date(now.setMonth(now.getMonth() - 3));
                break;
            case 'year':
                startDate = new Date(now.setFullYear(now.getFullYear() - 1));
                break;
            default:
                startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        // Get doses for the period
        const doses = await Dose.find({
            userId: req.userId,
            scheduledTime: { $gte: startDate }
        });

        const totalDoses = doses.length;
        const takenDoses = doses.filter(d => d.status === 'taken').length;
        const missedDoses = doses.filter(d => d.status === 'missed').length;
        const adherenceRate = totalDoses > 0 
            ? (takenDoses / totalDoses * 100).toFixed(1) 
            : 100;

        // Get adherence by day of week
        const adherenceByDay = {};
        doses.forEach(dose => {
            const day = dose.scheduledTime.toLocaleDateString('en-US', { weekday: 'long' });
            if (!adherenceByDay[day]) {
                adherenceByDay[day] = { total: 0, taken: 0 };
            }
            adherenceByDay[day].total++;
            if (dose.status === 'taken') {
                adherenceByDay[day].taken++;
            }
        });

        // Calculate adherence percentage by day
        const adherenceByDayPercentage = {};
        Object.keys(adherenceByDay).forEach(day => {
            const { total, taken } = adherenceByDay[day];
            adherenceByDayPercentage[day] = total > 0 
                ? ((taken / total) * 100).toFixed(1) 
                : 0;
        });

        // Get user for streak information
        const user = await User.findById(req.userId)
            .select('streaks rewardPoints');

        res.json({
            period,
            startDate,
            endDate: new Date(),
            adherenceRate: parseFloat(adherenceRate),
            totalDoses,
            takenDoses,
            missedDoses,
            adherenceByDay: adherenceByDayPercentage,
            streak: user.streaks.current,
            points: user.rewardPoints
        });
    } catch (error) {
        console.error('Get adherence analytics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getHealthTrends = async (req, res) => {
    try {
        const { metric, period = 'month' } = req.query;
        
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
            case 'quarter':
                startDate = new Date(now.setMonth(now.getMonth() - 3));
                break;
            default:
                startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        const entries = await HealthEntry.find({
            userId: req.userId,
            date: { $gte: startDate }
        }).sort({ date: 1 });

        let trends = [];
        
        switch (metric) {
            case 'bloodPressure':
                trends = entries.filter(e => e.bloodPressure).map(e => ({
                    date: e.date,
                    systolic: e.bloodPressure.systolic,
                    diastolic: e.bloodPressure.diastolic
                }));
                break;
                
            case 'bloodSugar':
                trends = entries.filter(e => e.bloodSugar).map(e => ({
                    date: e.date,
                    value: e.bloodSugar
                }));
                break;
                
            case 'weight':
                trends = entries.filter(e => e.weight).map(e => ({
                    date: e.date,
                    value: e.weight
                }));
                break;
                
            case 'temperature':
                trends = entries.filter(e => e.temperature).map(e => ({
                    date: e.date,
                    value: e.temperature
                }));
                break;
                
            case 'heartRate':
                trends = entries.filter(e => e.heartRate).map(e => ({
                    date: e.date,
                    value: e.heartRate
                }));
                break;
                
            default:
                // Return all metrics
                trends = {
                    bloodPressure: entries.filter(e => e.bloodPressure).map(e => ({
                        date: e.date,
                        systolic: e.bloodPressure.systolic,
                        diastolic: e.bloodPressure.diastolic
                    })),
                    bloodSugar: entries.filter(e => e.bloodSugar).map(e => ({
                        date: e.date,
                        value: e.bloodSugar
                    })),
                    weight: entries.filter(e => e.weight).map(e => ({
                        date: e.date,
                        value: e.weight
                    }))
                };
        }

        res.json({
            metric,
            period,
            trends
        });
    } catch (error) {
        console.error('Get health trends error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getMedicationHealthCorrelation = async (req, res) => {
    try {
        const { medicationId } = req.query;
        
        // Get dates when medication was taken
        const doses = await Dose.find({
            userId: req.userId,
            medicationId: medicationId,
            status: 'taken'
        }).select('scheduledTime');

        const medicationDates = doses.map(d => 
            d.scheduledTime.toISOString().split('T')[0]
        );

        // Get health entries around those dates
        const healthEntries = await HealthEntry.find({
            userId: req.userId,
            date: { 
                $in: medicationDates.map(d => new Date(d))
            }
        });

        // Group by medication taken status
        const withMedication = healthEntries.filter(e => e.medicationTaken === true);
        const withoutMedication = healthEntries.filter(e => e.medicationTaken === false);

        // Calculate averages
        const calculateAverage = (entries, field) => {
            const values = entries
                .filter(e => e[field] !== undefined)
                .map(e => e[field]);
            
            if (values.length === 0) return null;
            
            if (typeof values[0] === 'object') {
                // Handle blood pressure object
                const systolic = values.reduce((sum, v) => sum + v.systolic, 0) / values.length;
                const diastolic = values.reduce((sum, v) => sum + v.diastolic, 0) / values.length;
                return { systolic, diastolic };
            } else {
                return values.reduce((sum, v) => sum + v, 0) / values.length;
            }
        };

        const correlation = {
            bloodPressure: {
                withMedication: calculateAverage(withMedication, 'bloodPressure'),
                withoutMedication: calculateAverage(withoutMedication, 'bloodPressure')
            },
            bloodSugar: {
                withMedication: calculateAverage(withMedication, 'bloodSugar'),
                withoutMedication: calculateAverage(withoutMedication, 'bloodSugar')
            },
            weight: {
                withMedication: calculateAverage(withMedication, 'weight'),
                withoutMedication: calculateAverage(withoutMedication, 'weight')
            }
        };

        res.json({
            medicationId,
            correlation,
            sampleSize: {
                withMedication: withMedication.length,
                withoutMedication: withoutMedication.length
            }
        });
    } catch (error) {
        console.error('Get medication health correlation error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getDailyChartData = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const doses = await Dose.find({
            userId: req.userId,
            scheduledTime: { $gte: today, $lt: tomorrow }
        }).sort({ scheduledTime: 1 });

        const healthEntries = await HealthEntry.find({
            userId: req.userId,
            date: { $gte: today, $lt: tomorrow }
        });

        res.json({
            date: today,
            doses: doses.map(d => ({
                time: d.scheduledTime,
                medication: d.medicationId?.name || 'Unknown',
                status: d.status,
                dosage: d.medicationId?.dosage || ''
            })),
            healthEntries: healthEntries.map(e => ({
                time: e.date,
                bloodPressure: e.bloodPressure,
                bloodSugar: e.bloodSugar,
                weight: e.weight
            }))
        });
    } catch (error) {
        console.error('Get daily chart data error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// For router.get('/charts/weekly', healthController.getWeeklyChartData);
exports.getWeeklyChartData = async (req, res) => {
    try {
        const userId = req.userId;
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Get health entries from last week
        const healthEntries = await HealthEntry.find({
            userId,
            date: { $gte: weekAgo, $lte: now }
        }).sort({ date: 1 });

        // Get medication adherence for last week
        const doses = await Dose.find({
            userId,
            scheduledTime: { $gte: weekAgo, $lte: now }
        });

        // Calculate weekly adherence
        const totalDoses = doses.length;
        const takenDoses = doses.filter(d => d.status === 'taken').length;
        const adherenceRate = totalDoses > 0 
            ? Math.round((takenDoses / totalDoses) * 100)
            : 100;

        // Format data for charts
        const chartData = {
            period: 'weekly',
            startDate: weekAgo,
            endDate: now,
            adherence: {
                rate: adherenceRate,
                taken: takenDoses,
                total: totalDoses
            },
            healthMetrics: {
                bloodPressure: healthEntries.filter(e => e.bloodPressure).map(e => ({
                    date: e.date,
                    systolic: e.bloodPressure.systolic,
                    diastolic: e.bloodPressure.diastolic
                })),
                bloodSugar: healthEntries.filter(e => e.bloodSugar).map(e => ({
                    date: e.date,
                    value: e.bloodSugar
                })),
                weight: healthEntries.filter(e => e.weight).map(e => ({
                    date: e.date,
                    value: e.weight
                })),
                heartRate: healthEntries.filter(e => e.heartRate).map(e => ({
                    date: e.date,
                    value: e.heartRate
                }))
            },
            summary: {
                totalEntries: healthEntries.length,
                daysWithData: [...new Set(healthEntries.map(e => e.date.toDateString()))].length,
                averageBloodSugar: healthEntries.filter(e => e.bloodSugar).length > 0 
                    ? healthEntries.filter(e => e.bloodSugar)
                        .reduce((sum, e) => sum + e.bloodSugar, 0) / healthEntries.filter(e => e.bloodSugar).length
                    : null,
                averageWeight: healthEntries.filter(e => e.weight).length > 0
                    ? healthEntries.filter(e => e.weight)
                        .reduce((sum, e) => sum + e.weight, 0) / healthEntries.filter(e => e.weight).length
                    : null
            }
        };

        res.json({
            success: true,
            data: chartData
        });

    } catch (error) {
        console.error('Get weekly chart data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get weekly chart data',
            message: error.message
        });
    }
};

// For router.get('/charts/monthly', healthController.getMonthlyChartData);
exports.getMonthlyChartData = async (req, res) => {
    try {
        const userId = req.userId;
        const now = new Date();
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        // Get health entries from last month
        const healthEntries = await HealthEntry.find({
            userId,
            date: { $gte: monthAgo, $lte: now }
        }).sort({ date: 1 });

        // Get medication adherence for last month
        const doses = await Dose.find({
            userId,
            scheduledTime: { $gte: monthAgo, $lte: now }
        });

        // Calculate monthly adherence
        const totalDoses = doses.length;
        const takenDoses = doses.filter(d => d.status === 'taken').length;
        const adherenceRate = totalDoses > 0 
            ? Math.round((takenDoses / totalDoses) * 100)
            : 100;

        // Group data by week for monthly view
        const weeklyGroups = {};
        healthEntries.forEach(entry => {
            const weekNumber = Math.floor((entry.date - monthAgo) / (7 * 24 * 60 * 60 * 1000));
            if (!weeklyGroups[weekNumber]) {
                weeklyGroups[weekNumber] = [];
            }
            weeklyGroups[weekNumber].push(entry);
        });

        // Calculate weekly averages
        const weeklyAverages = Object.keys(weeklyGroups).map(week => {
            const weekEntries = weeklyGroups[week];
            const bloodSugarEntries = weekEntries.filter(e => e.bloodSugar);
            const weightEntries = weekEntries.filter(e => e.weight);
            const bpEntries = weekEntries.filter(e => e.bloodPressure);

            return {
                week: parseInt(week) + 1,
                startDate: weekEntries[0]?.date || monthAgo,
                averageBloodSugar: bloodSugarEntries.length > 0
                    ? bloodSugarEntries.reduce((sum, e) => sum + e.bloodSugar, 0) / bloodSugarEntries.length
                    : null,
                averageWeight: weightEntries.length > 0
                    ? weightEntries.reduce((sum, e) => sum + e.weight, 0) / weightEntries.length
                    : null,
                averageSystolic: bpEntries.length > 0
                    ? bpEntries.reduce((sum, e) => sum + e.bloodPressure.systolic, 0) / bpEntries.length
                    : null,
                averageDiastolic: bpEntries.length > 0
                    ? bpEntries.reduce((sum, e) => sum + e.bloodPressure.diastolic, 0) / bpEntries.length
                    : null,
                entryCount: weekEntries.length
            };
        });

        const chartData = {
            period: 'monthly',
            startDate: monthAgo,
            endDate: now,
            adherence: {
                rate: adherenceRate,
                taken: takenDoses,
                total: totalDoses,
                dailyAverage: totalDoses > 0 ? (takenDoses / 30).toFixed(1) : 0
            },
            weeklyTrends: weeklyAverages,
            monthlySummary: {
                totalEntries: healthEntries.length,
                daysTracked: [...new Set(healthEntries.map(e => e.date.toDateString()))].length,
                averageDailyEntries: (healthEntries.length / 30).toFixed(1),
                healthImprovement: calculateHealthImprovement(healthEntries),
                bestWeek: weeklyAverages.reduce((best, current) => 
                    current.entryCount > best.entryCount ? current : best
                )
            },
            recommendations: generateMonthlyRecommendations(healthEntries, adherenceRate)
        };

        res.json({
            success: true,
            data: chartData
        });

    } catch (error) {
        console.error('Get monthly chart data error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get monthly chart data',
            message: error.message
        });
    }
};

// Helper functions
function calculateHealthImprovement(entries) {
    if (entries.length < 2) return 'Insufficient data';
    
    const sortedEntries = entries.sort((a, b) => a.date - b.date);
    const firstWeek = sortedEntries.slice(0, Math.min(7, sortedEntries.length));
    const lastWeek = sortedEntries.slice(-7);
    
    const firstAvgBP = firstWeek.filter(e => e.bloodPressure).length > 0
        ? firstWeek.filter(e => e.bloodPressure)
            .reduce((sum, e) => sum + e.bloodPressure.systolic, 0) / firstWeek.filter(e => e.bloodPressure).length
        : null;
    
    const lastAvgBP = lastWeek.filter(e => e.bloodPressure).length > 0
        ? lastWeek.filter(e => e.bloodPressure)
            .reduce((sum, e) => sum + e.bloodPressure.systolic, 0) / lastWeek.filter(e => e.bloodPressure).length
        : null;
    
    if (firstAvgBP && lastAvgBP) {
        const improvement = firstAvgBP - lastAvgBP;
        if (improvement > 5) return 'Significant improvement';
        if (improvement > 0) return 'Slight improvement';
        if (improvement < -5) return 'Needs attention';
    }
    
    return 'Stable';
}

function generateMonthlyRecommendations(entries, adherenceRate) {
    const recommendations = [];
    
    if (adherenceRate < 80) {
        recommendations.push('⚠️ Medication adherence needs improvement. Try setting more reminders.');
    } else if (adherenceRate >= 95) {
        recommendations.push('✅ Excellent medication adherence! Keep up the great work.');
    }
    
    const bpEntries = entries.filter(e => e.bloodPressure);
    if (bpEntries.length > 0) {
        const avgSystolic = bpEntries.reduce((sum, e) => sum + e.bloodPressure.systolic, 0) / bpEntries.length;
        if (avgSystolic > 130) {
            recommendations.push('💙 Consider discussing blood pressure management with your healthcare provider.');
        }
    }
    
    const trackingDays = [...new Set(entries.map(e => e.date.toDateString()))].length;
    if (trackingDays < 15) {
        recommendations.push('📊 Try to track your health metrics more consistently for better insights.');
    }
    
    return recommendations.length > 0 ? recommendations : ['Keep up your current routine! Your health tracking is going well.'];
}
// Helper function to award points
async function awardPoints(userId, type, points) {
    try {
        const user = await User.findById(userId);
        if (user) {
            user.rewardPoints += points;
            await user.save();
            
            // Log reward
            const Reward = require('../models/Reward');
            const reward = new Reward({
                userId,
                points,
                type,
                description: `${points} points for ${type.replace('_', ' ')}`
            });
            await reward.save();
        }
    } catch (error) {
        console.error('Award points error:', error);
    }
}


exports.takeDose = async (req, res) => {
  try {
    // ... your existing dose logic
    
    // Award points for taking dose
    const rewardResult = await rewardService.awardDosePoints(req.userId, dose._id);
    
    res.json({
      ...doseResult,
      reward: rewardResult
    });
  } catch (error) {
    console.error('Error taking dose:', error);
    res.status(500).json({ error: 'Server error' });
  }
};