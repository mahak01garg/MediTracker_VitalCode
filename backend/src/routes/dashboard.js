const express = require('express');
const router = express.Router();
const  {auth,firebaseAuth}  = require('../middleware/auth'); // destructure correctly

const Medication = require('../models/Medication');
const Dose = require('../models/Dose');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const medications = await Medication.find({ user: userId });
        const activeMeds = medications.filter(m => m.isActive);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayDoses = await Dose.find({
            user: userId,
            scheduledTime: { $gte: today },
            status: 'pending'
        });

        const stats = {
            totalMedications: medications.length,
            activeMedications: activeMeds.length,
            dueToday: todayDoses.length,
            adherenceRate: medications.length > 0 ? 
                Math.round((activeMeds.length / medications.length) * 100) : 0
        };

        res.json(stats);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/dashboard/upcoming
// @desc    Get upcoming doses
// @access  Private
router.get('/upcoming', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const upcomingDoses = await Dose.find({
            user: userId,
            scheduledTime: { $gte: now, $lte: endOfDay },
            status: 'pending'
        }).populate('medication', 'name dosage')
          .sort('scheduledTime')
          .limit(10);

        res.json(upcomingDoses);
    } catch (error) {
        console.error('Upcoming doses error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/dashboard/recent
// @desc    Get recent doses
// @access  Private
router.get('/recent', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        const recentDoses = await Dose.find({
            user: userId,
            scheduledTime: { $gte: yesterday, $lte: now },
            status: { $in: ['taken', 'missed'] }
        }).populate('medication', 'name dosage')
          .sort('-scheduledTime')
          .limit(10);

        res.json(recentDoses);
    } catch (error) {
        console.error('Recent doses error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;