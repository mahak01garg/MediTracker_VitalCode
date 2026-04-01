const mongoose = require('mongoose');
const Dose = require('../models/Dose');
const Medication = require('../models/Medication');
const SideEffect = require('../models/SideEffect');
const User = require('../models/User');
const logger = require('../utils/logger');

class AnalyticsService {
  // Get dashboard overview
  async getDashboardOverview(userId, filters = {}) {
    try {
      const { startDate, endDate } = filters;
      const dateFilter = this._buildDateFilter(startDate, endDate);
      
      const [
        totalMedications,
        todayDoses,
        adherenceRate,
        upcomingDoses,
        recentSideEffects,
        streakInfo
      ] = await Promise.all([
        this._getTotalMedications(userId),
        this._getTodayDoses(userId),
        this._getAdherenceRate(userId, dateFilter),
        this._getUpcomingDoses(userId),
        this._getRecentSideEffects(userId),
        this._getStreakInfo(userId)
      ]);

      return {
        overview: {
          totalMedications,
          todayDoses,
          adherenceRate,
          upcomingDoses,
          recentSideEffects,
          streakInfo
        },
        filters: {
          startDate,
          endDate
        }
      };
    } catch (error) {
      logger.error('Error in getDashboardOverview:', error);
      throw error;
    }
  }

  // Get adherence analytics
  async getAdherenceAnalytics(userId, filters = {}) {
    try {
      const { medicationId, startDate, endDate, groupBy = 'day' } = filters;
      const dateFilter = this._buildDateFilter(startDate, endDate);
      
      const matchStage = {
        userId: new mongoose.Types.ObjectId(userId),
        ...dateFilter
      };
      
      if (medicationId) {
        matchStage.medicationId = new mongoose.Types.ObjectId(medicationId);
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: this._getGroupByStage(groupBy),
            totalDoses: { $sum: 1 },
            takenDoses: {
              $sum: {
                $cond: [{ $eq: ['$status', 'taken'] }, 1, 0]
              }
            },
            missedDoses: {
              $sum: {
                $cond: [{ $eq: ['$status', 'missed'] }, 1, 0]
              }
            },
            skippedDoses: {
              $sum: {
                $cond: [{ $eq: ['$status', 'skipped'] }, 1, 0]
              }
            }
          }
        },
        {
          $addFields: {
            adherenceRate: {
              $cond: [
                { $gt: ['$totalDoses', 0] },
                {
                  $multiply: [
                    { $divide: ['$takenDoses', '$totalDoses'] },
                    100
                  ]
                },
                0
              ]
            },
            date: '$_id'
          }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0 } }
      ];

      const adherenceData = await Dose.aggregate(pipeline);
      
      // Get medication details if specific medication
      let medicationDetails = null;
      if (medicationId) {
        medicationDetails = await Medication.findById(medicationId);
      }

      return {
        adherenceData,
        medicationDetails,
        summary: this._calculateAdherenceSummary(adherenceData),
        filters
      };
    } catch (error) {
      logger.error('Error in getAdherenceAnalytics:', error);
      throw error;
    }
  }

  // Get consumption trends
  async getConsumptionTrends(userId, filters = {}) {
    try {
      const { period = 'week', medicationId } = filters;
      
      const endDate = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const matchStage = {
        userId: new mongoose.Types.ObjectId(userId),
        scheduledTime: { $gte: startDate, $lte: endDate }
      };

      if (medicationId) {
        matchStage.medicationId = new mongoose.Types.ObjectId(medicationId);
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$scheduledTime'
              }
            },
            doses: { $push: '$$ROOT' },
            totalDoses: { $sum: 1 },
            takenCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'taken'] }, 1, 0]
              }
            },
            missedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'missed'] }, 1, 0]
              }
            }
          }
        },
        {
          $addFields: {
            adherenceRate: {
              $cond: [
                { $gt: ['$totalDoses', 0] },
                {
                  $multiply: [
                    { $divide: ['$takenCount', '$totalDoses'] },
                    100
                  ]
                },
                0
              ]
            }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: '$_id',
            totalDoses: 1,
            takenCount: 1,
            missedCount: 1,
            adherenceRate: 1,
            _id: 0
          }
        }
      ];

      const trends = await Dose.aggregate(pipeline);

      // Fill missing dates
      const filledTrends = this._fillMissingDates(trends, startDate, endDate);

      return {
        trends: filledTrends,
        period,
        startDate,
        endDate,
        summary: this._calculateTrendsSummary(filledTrends)
      };
    } catch (error) {
      logger.error('Error in getConsumptionTrends:', error);
      throw error;
    }
  }

  // Get side effects analytics
  async getSideEffectsAnalytics(userId, filters = {}) {
    try {
      const { startDate, endDate } = filters;
      const dateFilter = this._buildDateFilter(startDate, endDate, 'reportedAt');

      const matchStage = {
        userId: new mongoose.Types.ObjectId(userId),
        ...dateFilter
      };

      const pipeline = [
        { $match: matchStage },
        { $unwind: '$sideEffects' },
        {
          $group: {
            _id: '$sideEffects.name',
            count: { $sum: 1 },
            severityAvg: { $avg: '$sideEffects.severity' },
            occurrences: {
              $push: {
                date: '$reportedAt',
                medication: '$medicationId',
                severity: '$sideEffects.severity',
                notes: '$sideEffects.notes'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'medications',
            localField: 'occurrences.medication',
            foreignField: '_id',
            as: 'medicationDetails'
          }
        },
        {
          $project: {
            sideEffect: '$_id',
            count: 1,
            severityAvg: { $round: ['$severityAvg', 2] },
            occurrences: {
              $slice: ['$occurrences', 10]
            },
            medications: {
              $map: {
                input: '$medicationDetails',
                as: 'med',
                in: {
                  name: '$$med.name',
                  dosage: '$$med.dosage'
                }
              }
            },
            _id: 0
          }
        },
        { $sort: { count: -1 } }
      ];

      const sideEffects = await SideEffect.aggregate(pipeline);

      // Get severity distribution
      const severityDistribution = {
        mild: 0,
        moderate: 0,
        severe: 0
      };

      sideEffects.forEach(effect => {
        const severity = effect.severityAvg;
        if (severity <= 3) severityDistribution.mild++;
        else if (severity <= 7) severityDistribution.moderate++;
        else severityDistribution.severe++;
      });

      return {
        sideEffects,
        severityDistribution,
        totalSideEffects: sideEffects.reduce((sum, effect) => sum + effect.count, 0),
        uniqueSideEffects: sideEffects.length,
        filters
      };
    } catch (error) {
      logger.error('Error in getSideEffectsAnalytics:', error);
      throw error;
    }
  }

  // Get comparison analytics
  async getComparisonAnalytics(userId, filters = {}) {
    try {
      const { period = 'month', medications = [] } = filters;
      
      const endDate = new Date();
      let startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const medicationFilter = medications.length > 0
        ? { _id: { $in: medications.map(id => new mongoose.Types.ObjectId(id)) } }
        : { userId: new mongoose.Types.ObjectId(userId) };

      // Get medications with their adherence rates
      const meds = await Medication.find(medicationFilter);
      
      const comparisonData = await Promise.all(
        meds.map(async (medication) => {
          const adherenceData = await this.getAdherenceAnalytics(userId, {
            medicationId: medication._id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            groupBy: 'day'
          });

          const doses = await Dose.find({
            medicationId: medication._id,
            scheduledTime: { $gte: startDate, $lte: endDate }
          });

          const takenDoses = doses.filter(d => d.status === 'taken');
          const missedDoses = doses.filter(d => d.status === 'missed');

          return {
            medicationId: medication._id,
            name: medication.name,
            dosage: medication.dosage,
            frequency: medication.frequency,
            adherenceRate: adherenceData.summary.averageAdherence,
            totalDoses: doses.length,
            takenDoses: takenDoses.length,
            missedDoses: missedDoses.length,
            complianceScore: this._calculateComplianceScore(medication, takenDoses, missedDoses),
            lastTaken: takenDoses.length > 0
              ? Math.max(...takenDoses.map(d => d.actualTakenTime || d.scheduledTime))
              : null
          };
        })
      );

      return {
        comparisonData: comparisonData.sort((a, b) => b.adherenceRate - a.adherenceRate),
        period,
        startDate,
        endDate,
        summary: this._calculateComparisonSummary(comparisonData)
      };
    } catch (error) {
      logger.error('Error in getComparisonAnalytics:', error);
      throw error;
    }
  }

  // Get predictive insights
  async getPredictiveInsights(userId) {
    try {
      const user = await User.findById(userId);
      const medications = await Medication.find({ userId });
      
      if (medications.length === 0) {
        return {
          insights: [],
          recommendations: []
        };
      }

      const insights = [];
      const recommendations = [];

      // Analyze adherence patterns
      const adherenceData = await this.getAdherenceAnalytics(userId, {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      });

      // Insight 1: Overall adherence trend
      if (adherenceData.summary.averageAdherence < 80) {
        insights.push({
          type: 'warning',
          title: 'Adherence Below Target',
          description: `Your current adherence rate is ${adherenceData.summary.averageAdherence.toFixed(1)}%. Aim for 90%+ for optimal results.`,
          priority: 'high'
        });
        
        recommendations.push({
          type: 'reminder',
          title: 'Set Additional Reminders',
          description: 'Consider setting multiple reminders or enabling push notifications for better adherence.'
        });
      }

      // Analyze timing patterns
      const doses = await Dose.find({
        userId,
        status: 'taken',
        actualTakenTime: { $exists: true }
      }).sort({ scheduledTime: 1 }).limit(100);

      if (doses.length > 10) {
        const timeDeviations = doses.map(dose => {
          const scheduled = new Date(dose.scheduledTime);
          const actual = new Date(dose.actualTakenTime);
          return Math.abs(actual - scheduled) / (1000 * 60); // minutes difference
        });

        const avgDeviation = timeDeviations.reduce((a, b) => a + b, 0) / timeDeviations.length;
        
        if (avgDeviation > 60) {
          insights.push({
            type: 'info',
            title: 'Timing Consistency',
            description: `You're taking medications an average of ${Math.round(avgDeviation)} minutes off schedule.`,
            priority: 'medium'
          });
          
          recommendations.push({
            type: 'schedule',
            title: 'Optimize Schedule',
            description: 'Try to take medications at consistent times each day for better effectiveness.'
          });
        }
      }

      // Analyze side effects
      const sideEffectsData = await this.getSideEffectsAnalytics(userId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (sideEffectsData.totalSideEffects > 0) {
        const severeEffects = sideEffectsData.sideEffects.filter(e => e.severityAvg >= 7);
        
        if (severeEffects.length > 0) {
          insights.push({
            type: 'alert',
            title: 'Severe Side Effects Detected',
            description: `${severeEffects.length} severe side effect(s) reported recently.`,
            priority: 'high'
          });
          
          recommendations.push({
            type: 'consultation',
            title: 'Consult Healthcare Provider',
            description: 'Consider discussing severe side effects with your healthcare provider.'
          });
        }
      }

      // Check for medication interactions
      if (medications.length > 1) {
        insights.push({
          type: 'info',
          title: 'Multiple Medications',
          description: `You're taking ${medications.length} medications. Monitor for potential interactions.`,
          priority: 'low'
        });
      }

      // Check for upcoming refills
      const upcomingRefills = medications.filter(med => {
        const daysLeft = Math.ceil((new Date(med.refillDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7 && daysLeft > 0;
      });

      if (upcomingRefills.length > 0) {
        insights.push({
          type: 'reminder',
          title: 'Upcoming Refills',
          description: `${upcomingRefills.length} medication(s) need refill in the next week.`,
          priority: 'medium'
        });
        
        recommendations.push({
          type: 'refill',
          title: 'Schedule Refills',
          description: 'Contact your pharmacy to refill medications before they run out.'
        });
      }

      return {
        insights: insights.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }),
        recommendations: recommendations.slice(0, 5), // Limit to top 5 recommendations
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error in getPredictiveInsights:', error);
      throw error;
    }
  }

  // Export analytics data
  async exportAnalyticsData(userId, filters = {}) {
    try {
      const { format = 'csv', startDate, endDate } = filters;
      
      // Get all relevant data
      const [doses, medications, sideEffects] = await Promise.all([
        Dose.find({
          userId,
          ...this._buildDateFilter(startDate, endDate)
        }).sort({ scheduledTime: 1 }),
        
        Medication.find({ userId }),
        
        SideEffect.find({
          userId,
          ...this._buildDateFilter(startDate, endDate, 'reportedAt')
        }).sort({ reportedAt: 1 })
      ]);

      if (format === 'csv') {
        return this._convertToCSV({ doses, medications, sideEffects });
      } else if (format === 'json') {
        return JSON.stringify({ doses, medications, sideEffects }, null, 2);
      } else {
        throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      logger.error('Error in exportAnalyticsData:', error);
      throw error;
    }
  }

  // Helper Methods
  _buildDateFilter(startDate, endDate, field = 'scheduledTime') {
    const filter = {};
    if (startDate) {
      filter[field] = { ...filter[field], $gte: new Date(startDate) };
    }
    if (endDate) {
      filter[field] = { ...filter[field], $lte: new Date(endDate) };
    }
    return Object.keys(filter).length > 0 ? filter : {};
  }

  _getGroupByStage(groupBy) {
    switch (groupBy) {
      case 'hour':
        return {
          year: { $year: '$scheduledTime' },
          month: { $month: '$scheduledTime' },
          day: { $dayOfMonth: '$scheduledTime' },
          hour: { $hour: '$scheduledTime' }
        };
      case 'week':
        return {
          year: { $year: '$scheduledTime' },
          week: { $week: '$scheduledTime' }
        };
      case 'month':
        return {
          year: { $year: '$scheduledTime' },
          month: { $month: '$scheduledTime' }
        };
      case 'day':
      default:
        return {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$scheduledTime'
          }
        };
    }
  }

  _calculateAdherenceSummary(adherenceData) {
    if (adherenceData.length === 0) {
      return {
        averageAdherence: 0,
        totalDoses: 0,
        takenDoses: 0,
        missedDoses: 0,
        skippedDoses: 0,
        bestDay: null,
        worstDay: null
      };
    }

    const totalDoses = adherenceData.reduce((sum, day) => sum + day.totalDoses, 0);
    const takenDoses = adherenceData.reduce((sum, day) => sum + day.takenDoses, 0);
    const averageAdherence = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

    let bestDay = adherenceData[0];
    let worstDay = adherenceData[0];

    adherenceData.forEach(day => {
      if (day.adherenceRate > bestDay.adherenceRate) bestDay = day;
      if (day.adherenceRate < worstDay.adherenceRate) worstDay = day;
    });

    return {
      averageAdherence: parseFloat(averageAdherence.toFixed(1)),
      totalDoses,
      takenDoses,
      missedDoses: adherenceData.reduce((sum, day) => sum + day.missedDoses, 0),
      skippedDoses: adherenceData.reduce((sum, day) => sum + day.skippedDoses, 0),
      bestDay: {
        date: bestDay.date,
        adherenceRate: bestDay.adherenceRate
      },
      worstDay: {
        date: worstDay.date,
        adherenceRate: worstDay.adherenceRate
      }
    };
  }

  _fillMissingDates(trends, startDate, endDate) {
    const filled = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = trends.find(t => t.date === dateStr);
      
      filled.push({
        date: dateStr,
        totalDoses: existingData?.totalDoses || 0,
        takenCount: existingData?.takenCount || 0,
        missedCount: existingData?.missedCount || 0,
        adherenceRate: existingData?.adherenceRate || 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filled;
  }

  _calculateTrendsSummary(trends) {
    const totalDoses = trends.reduce((sum, day) => sum + day.totalDoses, 0);
    const totalTaken = trends.reduce((sum, day) => sum + day.takenCount, 0);
    const averageAdherence = totalDoses > 0 ? (totalTaken / totalDoses) * 100 : 0;

    const adherenceRates = trends.map(t => t.adherenceRate).filter(r => r > 0);
    const avgAdherence = adherenceRates.length > 0
      ? adherenceRates.reduce((a, b) => a + b, 0) / adherenceRates.length
      : 0;

    return {
      totalDays: trends.length,
      totalDoses,
      totalTaken,
      totalMissed: trends.reduce((sum, day) => sum + day.missedCount, 0),
      averageAdherence: parseFloat(averageAdherence.toFixed(1)),
      avgDailyAdherence: parseFloat(avgAdherence.toFixed(1)),
      highestAdherence: Math.max(...trends.map(t => t.adherenceRate)),
      lowestAdherence: Math.min(...trends.filter(t => t.totalDoses > 0).map(t => t.adherenceRate))
    };
  }

  _calculateComplianceScore(medication, takenDoses, missedDoses) {
    const total = takenDoses.length + missedDoses.length;
    if (total === 0) return 0;

    const adherence = (takenDoses.length / total) * 100;
    
    // Penalize for missed doses
    let score = adherence;
    if (missedDoses.length > 0) {
      score -= missedDoses.length * 2;
    }

    // Consider timing consistency for taken doses
    if (takenDoses.length > 1) {
      const times = takenDoses.map(d => new Date(d.actualTakenTime || d.scheduledTime).getTime());
      times.sort((a, b) => a - b);
      
      let totalDeviation = 0;
      for (let i = 1; i < times.length; i++) {
        totalDeviation += Math.abs(times[i] - times[i - 1]);
      }
      
      const avgDeviationHours = totalDeviation / (times.length - 1) / (1000 * 60 * 60);
      if (avgDeviationHours > 2) {
        score -= 5;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  _calculateComparisonSummary(comparisonData) {
    if (comparisonData.length === 0) {
      return {
        totalMedications: 0,
        averageAdherence: 0,
        bestPerforming: null,
        needsAttention: []
      };
    }

    const totalAdherence = comparisonData.reduce((sum, med) => sum + med.adherenceRate, 0);
    const averageAdherence = totalAdherence / comparisonData.length;

    const bestPerforming = comparisonData.reduce((best, current) => 
      current.adherenceRate > best.adherenceRate ? current : best
    );

    const needsAttention = comparisonData.filter(med => med.adherenceRate < 80);

    return {
      totalMedications: comparisonData.length,
      averageAdherence: parseFloat(averageAdherence.toFixed(1)),
      bestPerforming: {
        name: bestPerforming.name,
        adherenceRate: bestPerforming.adherenceRate
      },
      needsAttention: needsAttention.map(med => ({
        name: med.name,
        adherenceRate: med.adherenceRate
      }))
    };
  }

  _convertToCSV(data) {
    const { doses, medications, sideEffects } = data;
    
    let csv = 'MediTracker Analytics Export\n\n';
    
    // Doses Section
    csv += 'DOSES\n';
    csv += 'Scheduled Time,Medication,Status,Actual Taken Time,Notes\n';
    doses.forEach(dose => {
      csv += `${dose.scheduledTime},${dose.medicationId},${dose.status},${dose.actualTakenTime || ''},"${dose.notes || ''}"\n`;
    });
    
    csv += '\n\nMEDICATIONS\n';
    csv += 'Name,Dosage,Frequency,Instructions,Start Date,Refill Date\n';
    medications.forEach(med => {
      csv += `"${med.name}","${med.dosage}",${med.frequency},"${med.instructions || ''}",${med.startDate},${med.refillDate}\n`;
    });
    
    csv += '\n\nSIDE EFFECTS\n';
    csv += 'Reported Date,Medication,Side Effect,Severity,Notes\n';
    sideEffects.forEach(effect => {
      effect.sideEffects.forEach(se => {
        csv += `${effect.reportedAt},${effect.medicationId},"${se.name}",${se.severity},"${se.notes || ''}"\n`;
      });
    });
    
    return csv;
  }

  // Private helper methods for dashboard
  async _getTotalMedications(userId) {
    return await Medication.countDocuments({ userId });
  }

  async _getTodayDoses(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const doses = await Dose.find({
      userId,
      scheduledTime: { $gte: today, $lt: tomorrow }
    }).populate('medicationId', 'name dosage');

    return {
      total: doses.length,
      taken: doses.filter(d => d.status === 'taken').length,
      upcoming: doses.filter(d => d.status === 'scheduled').length,
      missed: doses.filter(d => d.status === 'missed').length,
      doses: doses.slice(0, 5) // Return only first 5 for display
    };
  }

  async _getAdherenceRate(userId, dateFilter) {
    const matchStage = {
      userId: new mongoose.Types.ObjectId(userId),
      ...dateFilter
    };

    const result = await Dose.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          taken: {
            $sum: { $cond: [{ $eq: ['$status', 'taken'] }, 1, 0] }
          }
        }
      }
    ]);

    if (result.length === 0 || result[0].total === 0) {
      return 0;
    }

    return parseFloat(((result[0].taken / result[0].total) * 100).toFixed(1));
  }

  async _getUpcomingDoses(userId) {
    const now = new Date();
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const doses = await Dose.find({
      userId,
      status: 'scheduled',
      scheduledTime: { $gte: now, $lte: threeHoursLater }
    })
    .populate('medicationId', 'name dosage')
    .sort({ scheduledTime: 1 })
    .limit(5);

    return doses;
  }

  async _getRecentSideEffects(userId) {
    const sideEffects = await SideEffect.find({ userId })
      .populate('medicationId', 'name')
      .sort({ reportedAt: -1 })
      .limit(5);

    return sideEffects.map(effect => ({
      ...effect.toObject(),
      sideEffects: effect.sideEffects.slice(0, 2) // Only show first 2 side effects
    }));
  }

  async _getStreakInfo(userId) {
    const doses = await Dose.find({
      userId,
      status: 'taken',
      scheduledTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ scheduledTime: -1 });

    if (doses.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toDateString();
    let currentDate = new Date().toDateString();
    const takenDates = [...new Set(doses.map(d => new Date(d.actualTakenTime || d.scheduledTime).toDateString()))].sort().reverse();

    for (const dateStr of takenDates) {
      if (dateStr === currentDate || (currentStreak > 0 && this._isPreviousDay(dateStr, currentDate))) {
        currentStreak++;
        currentDate = dateStr;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let currentLongest = 1;
    
    for (let i = 1; i < takenDates.length; i++) {
      if (this._isPreviousDay(takenDates[i], takenDates[i - 1])) {
        currentLongest++;
        longestStreak = Math.max(longestStreak, currentLongest);
      } else {
        currentLongest = 1;
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentLongest),
      lastTaken: doses[0]?.actualTakenTime || doses[0]?.scheduledTime
    };
  }

  _isPreviousDay(prevDateStr, currentDateStr) {
    const prevDate = new Date(prevDateStr);
    const currentDate = new Date(currentDateStr);
    const diffTime = currentDate - prevDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  }
}

module.exports = new AnalyticsService();