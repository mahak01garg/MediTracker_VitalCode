const ChatbotService = require('../services/ai/ChatbotService');
const PredictionService = require('../services/ai/PredictionService');
const Dose = require('../models/Dose');
const Medication = require('../models/Medication');

exports.chat = async (req, res) => {
    try {
        console.log('=== AI CHAT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User from auth:', req.user);
    console.log('Headers:', req.headers);
    
        const { query } = req.body;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ 
                error: 'Query is required and must be a string' 
            });
        }

        const response = await ChatbotService.processQuery(req.userId, query);

        res.json({
            query,
            response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ 
            error: 'Failed to process your query. Please try again.' 
        });
    }
};

exports.getMissedDosePredictions = async (req, res) => {
    try {
        const predictions = await PredictionService.getPredictions(req.userId);

        res.json({
            predictions,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Get predictions error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getTodaySummary = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's doses
        const doses = await Dose.find({
            userId: req.userId,
            scheduledTime: { $gte: today, $lt: tomorrow }
        })
        .populate('medicationId', 'name dosage')
        .sort({ scheduledTime: 1 });

        // Categorize doses
        const pending = doses.filter(d => d.status === 'pending' || d.status === 'snoozed');
        const taken = doses.filter(d => d.status === 'taken');
        const missed = doses.filter(d => d.status === 'missed');

        // Get active medications
        const activeMedications = await Medication.find({
            userId: req.userId,
            isActive: true
        }).countDocuments();

        // Calculate adherence for today
        const totalDosesToday = doses.length;
        const adherenceToday = totalDosesToday > 0 
            ? (taken.length / totalDosesToday * 100).toFixed(1) 
            : '100.0';

        // Generate summary text
        let summary = `Today's Medication Summary:\n\n`;
        
        if (pending.length > 0) {
            summary += `📋 Upcoming (${pending.length}):\n`;
            pending.forEach(dose => {
                const time = dose.scheduledTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                summary += `• ${dose.medicationId.name} (${dose.medicationId.dosage}) at ${time}\n`;
            });
            summary += '\n';
        }

        if (taken.length > 0) {
            summary += `✅ Taken (${taken.length}):\n`;
            taken.forEach(dose => {
                const time = dose.actualTime?.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }) || 'Unknown time';
                summary += `• ${dose.medicationId.name} at ${time}\n`;
            });
            summary += '\n';
        }

        if (missed.length > 0) {
            summary += `❌ Missed (${missed.length}):\n`;
            missed.forEach(dose => {
                const time = dose.scheduledTime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                summary += `• ${dose.medicationId.name} at ${time}\n`;
            });
            summary += '\n';
        }

        summary += `📊 Adherence today: ${adherenceToday}%\n`;
        summary += `💊 Active medications: ${activeMedications}`;

        res.json({
            summary,
            statistics: {
                totalDoses: totalDosesToday,
                pending: pending.length,
                taken: taken.length,
                missed: missed.length,
                adherenceRate: parseFloat(adherenceToday),
                activeMedications
            },
            doses: {
                pending,
                taken,
                missed
            }
        });
    } catch (error) {
        console.error('Get today summary error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getWeekSummary = async (req, res) => {
    try {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Get doses for the past week
        const doses = await Dose.find({
            userId: req.userId,
            scheduledTime: { $gte: weekAgo, $lte: today }
        })
        .populate('medicationId', 'name')
        .sort({ scheduledTime: 1 });

        // Group by day
        const dosesByDay = {};
        const adherenceByDay = {};

        // Initialize days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dosesByDay[dateStr] = { total: 0, taken: 0, missed: 0 };
            adherenceByDay[dateStr] = 0;
        }

        // Count doses by day
        doses.forEach(dose => {
            const dateStr = dose.scheduledTime.toISOString().split('T')[0];
            if (dosesByDay[dateStr]) {
                dosesByDay[dateStr].total++;
                if (dose.status === 'taken') {
                    dosesByDay[dateStr].taken++;
                } else if (dose.status === 'missed') {
                    dosesByDay[dateStr].missed++;
                }
            }
        });

        // Calculate adherence by day
        Object.keys(dosesByDay).forEach(dateStr => {
            const { total, taken } = dosesByDay[dateStr];
            adherenceByDay[dateStr] = total > 0 
                ? (taken / total * 100).toFixed(1) 
                : '100.0';
        });

        // Calculate overall week statistics
        const totalDosesWeek = doses.length;
        const takenDosesWeek = doses.filter(d => d.status === 'taken').length;
        const adherenceWeek = totalDosesWeek > 0 
            ? (takenDosesWeek / totalDosesWeek * 100).toFixed(1) 
            : '100.0';

        // Find most missed medication
        const missedByMedication = {};
        doses.filter(d => d.status === 'missed').forEach(dose => {
            const medName = dose.medicationId.name;
            missedByMedication[medName] = (missedByMedication[medName] || 0) + 1;
        });

        let mostMissedMedication = null;
        let maxMissed = 0;
        Object.keys(missedByMedication).forEach(medName => {
            if (missedByMedication[medName] > maxMissed) {
                maxMissed = missedByMedication[medName];
                mostMissedMedication = medName;
            }
        });

        // Generate summary
        let summary = `Weekly Medication Summary (Last 7 Days):\n\n`;
        summary += `📊 Overall adherence: ${adherenceWeek}%\n`;
        summary += `✅ Doses taken: ${takenDosesWeek}/${totalDosesWeek}\n`;
        
        if (mostMissedMedication) {
            summary += `⚠️ Most missed: ${mostMissedMedication} (${maxMissed} times)\n`;
        }
        
        summary += `\nDaily breakdown:\n`;
        Object.keys(adherenceByDay).forEach(dateStr => {
            const date = new Date(dateStr);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            summary += `${dayName}: ${adherenceByDay[dateStr]}%\n`;
        });

        res.json({
            summary,
            statistics: {
                period: 'week',
                startDate: weekAgo,
                endDate: today,
                totalDoses: totalDosesWeek,
                takenDoses: takenDosesWeek,
                adherenceRate: parseFloat(adherenceWeek),
                mostMissedMedication,
                maxMissed
            },
            dailyData: {
                dosesByDay,
                adherenceByDay
            }
        });
    } catch (error) {
        console.error('Get week summary error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getMedicationAdvice = async (req, res) => {
    try {
        const { medicationName, question } = req.body;

        if (!medicationName) {
            return res.status(400).json({ 
                error: 'Medication name is required' 
            });
        }

        // Get medication information
        const medication = await Medication.findOne({
            userId: req.userId,
            name: { $regex: new RegExp(medicationName, 'i') }
        });

        if (!medication) {
            return res.status(404).json({ 
                error: 'Medication not found in your records' 
            });
        }

        // Get recent doses for this medication
        const recentDoses = await Dose.find({
            userId: req.userId,
            medicationId: medication._id,
            scheduledTime: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        })
        .sort({ scheduledTime: -1 })
        .limit(10);

        // Calculate adherence for this medication
        const totalDoses = recentDoses.length;
        const takenDoses = recentDoses.filter(d => d.status === 'taken').length;
        const adherence = totalDoses > 0 
            ? (takenDoses / totalDoses * 100).toFixed(1) 
            : 'N/A';

        // Generate advice based on adherence
        let advice = '';
        if (adherence !== 'N/A') {
            const adherenceNum = parseFloat(adherence);
            if (adherenceNum >= 90) {
                advice = `Excellent! You're doing great with taking ${medication.name}. Keep up the good work!`;
            } else if (adherenceNum >= 70) {
                advice = `You're doing okay with ${medication.name}, but there's room for improvement. Try setting more reminders.`;
            } else {
                advice = `Your adherence with ${medication.name} needs improvement. Consider connecting with a caregiver or setting up emergency notifications.`;
            }
        }

        // If there's a specific question, use AI to answer
        let answer = '';
        if (question) {
            const ChatbotService = require('../services/ai/ChatbotService');
            answer = await ChatbotService.answerGeneralQuestion(
                `About medication ${medication.name} (${medication.dosage}): ${question}`
            );
        }

        res.json({
            medication: {
                name: medication.name,
                dosage: medication.dosage,
                frequency: medication.frequency,
                instructions: medication.instructions
            },
            adherence: {
                rate: adherence,
                taken: takenDoses,
                total: totalDoses
            },
            advice,
            answer,
            recentDoses: recentDoses.map(d => ({
                date: d.scheduledTime,
                status: d.status,
                actualTime: d.actualTime
            }))
        });
    } catch (error) {
        console.error('Get medication advice error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};