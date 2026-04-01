const Dose = require('../../models/Dose');
const User = require('../../models/User');
const logger = require('../../utils/logger');

class PredictionService {
    constructor() {
        this.historicalData = new Map();
    }

    async getPredictions(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                return [];
            }

            // Get historical data (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const historicalDoses = await Dose.find({
                userId,
                scheduledTime: { $gte: thirtyDaysAgo }
            }).sort({ scheduledTime: 1 });

            // Get upcoming doses (next 7 days)
            const now = new Date();
            const sevenDaysLater = new Date(now);
            sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

            const upcomingDoses = await Dose.find({
                userId,
                scheduledTime: { $gte: now, $lte: sevenDaysLater },
                status: 'pending'
            })
            .populate('medicationId')
            .sort({ scheduledTime: 1 });

            if (historicalDoses.length === 0 || upcomingDoses.length === 0) {
                return [];
            }

            // Analyze patterns
            const patterns = this.analyzePatterns(historicalDoses);
            
            // Generate predictions for upcoming doses
            const predictions = upcomingDoses.map(dose => {
                const riskLevel = this.predictMissRisk(dose, patterns, user);
                return {
                    doseId: dose._id,
                    medicationName: dose.medicationId.name,
                    scheduledTime: dose.scheduledTime,
                    riskLevel,
                    confidence: this.calculateConfidence(patterns),
                    suggestions: this.getSuggestions(riskLevel, dose, patterns)
                };
            });

            // Filter only high and medium risk predictions
            const relevantPredictions = predictions.filter(p => 
                p.riskLevel === 'high' || p.riskLevel === 'medium'
            );

            return relevantPredictions;
        } catch (error) {
            logger.error('Prediction generation error:', error);
            return [];
        }
    }

    analyzePatterns(doses) {
        const patterns = {
            byDayOfWeek: {},
            byTimeOfDay: {},
            byMedication: {},
            missedTimes: [],
            takenTimes: []
        };

        doses.forEach(dose => {
            const day = dose.scheduledTime.getDay();
            const hour = dose.scheduledTime.getHours();
            const medicationId = dose.medicationId.toString();
            
            // Count by day of week
            if (!patterns.byDayOfWeek[day]) {
                patterns.byDayOfWeek[day] = { total: 0, taken: 0 };
            }
            patterns.byDayOfWeek[day].total++;
            if (dose.status === 'taken') {
                patterns.byDayOfWeek[day].taken++;
                patterns.takenTimes.push(hour);
            } else if (dose.status === 'missed') {
                patterns.missedTimes.push(hour);
            }

            // Count by time of day
            const timeSlot = this.getTimeSlot(hour);
            if (!patterns.byTimeOfDay[timeSlot]) {
                patterns.byTimeOfDay[timeSlot] = { total: 0, taken: 0 };
            }
            patterns.byTimeOfDay[timeSlot].total++;
            if (dose.status === 'taken') {
                patterns.byTimeOfDay[timeSlot].taken++;
            }

            // Count by medication
            if (!patterns.byMedication[medicationId]) {
                patterns.byMedication[medicationId] = { total: 0, taken: 0 };
            }
            patterns.byMedication[medicationId].total++;
            if (dose.status === 'taken') {
                patterns.byMedication[medicationId].taken++;
            }
        });

        // Calculate adherence rates
        patterns.byDayOfWeekAdherence = {};
        Object.keys(patterns.byDayOfWeek).forEach(day => {
            const { total, taken } = patterns.byDayOfWeek[day];
            patterns.byDayOfWeekAdherence[day] = total > 0 ? (taken / total) : 1;
        });

        patterns.byTimeOfDayAdherence = {};
        Object.keys(patterns.byTimeOfDay).forEach(slot => {
            const { total, taken } = patterns.byTimeOfDay[slot];
            patterns.byTimeOfDayAdherence[slot] = total > 0 ? (taken / total) : 1;
        });

        patterns.byMedicationAdherence = {};
        Object.keys(patterns.byMedication).forEach(medId => {
            const { total, taken } = patterns.byMedication[medId];
            patterns.byMedicationAdherence[medId] = total > 0 ? (taken / total) : 1;
        });

        // Calculate average missed time
        if (patterns.missedTimes.length > 0) {
            const sum = patterns.missedTimes.reduce((a, b) => a + b, 0);
            patterns.avgMissedHour = sum / patterns.missedTimes.length;
        }

        return patterns;
    }

    predictMissRisk(dose, patterns, user) {
        const dayOfWeek = dose.scheduledTime.getDay();
        const hour = dose.scheduledTime.getHours();
        const timeSlot = this.getTimeSlot(hour);
        const medicationId = dose.medicationId.toString();

        let riskScore = 0;
        
        // Check day of week pattern
        const dayAdherence = patterns.byDayOfWeekAdherence[dayOfWeek] || 1;
        if (dayAdherence < 0.7) riskScore += 30;
        else if (dayAdherence < 0.85) riskScore += 15;

        // Check time of day pattern
        const timeAdherence = patterns.byTimeOfDayAdherence[timeSlot] || 1;
        if (timeAdherence < 0.7) riskScore += 30;
        else if (timeAdherence < 0.85) riskScore += 15;

        // Check medication-specific pattern
        const medAdherence = patterns.byMedicationAdherence[medicationId] || 1;
        if (medAdherence < 0.7) riskScore += 25;
        else if (medAdherence < 0.85) riskScore += 10;

        // Check if this time is typically missed
        if (patterns.avgMissedHour && Math.abs(hour - patterns.avgMissedHour) <= 2) {
            riskScore += 20;
        }

        // Consider user's current streak
        if (user.streaks.current < 3) {
            riskScore += 10;
        } else if (user.streaks.current >= 14) {
            riskScore -= 10;
        }

        // Adjust for time of day (people often miss morning/evening doses)
        if (hour >= 22 || hour <= 6) { // Late night or early morning
            riskScore += 15;
        }

        // Normalize risk score
        riskScore = Math.max(0, Math.min(100, riskScore));

        // Convert to risk level
        if (riskScore >= 70) return 'high';
        if (riskScore >= 40) return 'medium';
        return 'low';
    }

    getTimeSlot(hour) {
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 22) return 'evening';
        return 'night';
    }

    calculateConfidence(patterns) {
        const totalDataPoints = Object.values(patterns.byDayOfWeek).reduce((sum, day) => sum + day.total, 0);
        
        if (totalDataPoints >= 50) return 'high';
        if (totalDataPoints >= 20) return 'medium';
        return 'low';
    }

    getSuggestions(riskLevel, dose, patterns) {
        const suggestions = [];
        const hour = dose.scheduledTime.getHours();
        const dayOfWeek = dose.scheduledTime.getDay();
        const medicationId = dose.medicationId.toString();

        if (riskLevel === 'high') {
            suggestions.push('Set an additional reminder 15 minutes before');
            suggestions.push('Ask a family member or caregiver to remind you');
            suggestions.push('Consider taking medication with a daily routine (e.g., with breakfast)');
            
            // Time-specific suggestions
            if (hour >= 22 || hour <= 6) {
                suggestions.push('Place medication by your bedside for easy access');
            }
        }

        if (riskLevel === 'medium' || riskLevel === 'high') {
            // Day-specific suggestions
            const dayAdherence = patterns.byDayOfWeekAdherence[dayOfWeek];
            if (dayAdherence && dayAdherence < 0.8) {
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                suggestions.push(`Be extra vigilant on ${dayNames[dayOfWeek]}s - you tend to miss doses on this day`);
            }

            // Medication-specific suggestions
            const medAdherence = patterns.byMedicationAdherence[medicationId];
            if (medAdherence && medAdherence < 0.8) {
                suggestions.push(`Consider using a pill organizer for this medication`);
            }
        }

        // General suggestions
        suggestions.push('Enable push notifications for instant reminders');
        suggestions.push('Keep medication in a visible location');

        return suggestions.slice(0, 3); // Return top 3 suggestions
    }

    async trainModel(userId) {
        // This would be used for more advanced ML predictions
        // For now, we're using rule-based predictions
        logger.info(`Training prediction model for user ${userId}`);
        return true;
    }

    async getUserPatternSummary(userId) {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const doses = await Dose.find({
                userId,
                scheduledTime: { $gte: thirtyDaysAgo }
            }).populate('medicationId');

            if (doses.length === 0) {
                return { message: 'Not enough data for pattern analysis' };
            }

            const patterns = this.analyzePatterns(doses);
            
            // Convert day numbers to names
            const dayMap = {
                0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
                4: 'Thursday', 5: 'Friday', 6: 'Saturday'
            };

            const bestDay = Object.entries(patterns.byDayOfWeekAdherence)
                .reduce((best, [day, adherence]) => {
                    if (!best || adherence > best.adherence) {
                        return { day: dayMap[day], adherence };
                    }
                    return best;
                }, null);

            const worstDay = Object.entries(patterns.byDayOfWeekAdherence)
                .reduce((worst, [day, adherence]) => {
                    if (!worst || adherence < worst.adherence) {
                        return { day: dayMap[day], adherence };
                    }
                    return worst;
                }, null);

            const bestTimeSlot = Object.entries(patterns.byTimeOfDayAdherence)
                .reduce((best, [slot, adherence]) => {
                    if (!best || adherence > best.adherence) {
                        return { slot, adherence };
                    }
                    return best;
                }, null);

            return {
                totalDosesAnalyzed: doses.length,
                bestDay,
                worstDay,
                bestTimeSlot,
                overallAdherence: this.calculateOverallAdherence(doses),
                patterns: {
                    byDay: patterns.byDayOfWeekAdherence,
                    byTime: patterns.byTimeOfDayAdherence
                }
            };
        } catch (error) {
            logger.error('Pattern summary error:', error);
            return { error: 'Failed to analyze patterns' };
        }
    }

    calculateOverallAdherence(doses) {
        const total = doses.length;
        const taken = doses.filter(d => d.status === 'taken').length;
        return total > 0 ? (taken / total * 100).toFixed(1) : '100.0';
    }
}

module.exports = new PredictionService();