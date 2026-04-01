const express = require('express');
const router = express.Router();

// Import the auth middleware correctly
const {auth,firebaseAuth} = require('../middleware/auth');        // normal auth

const Dose = require('../models/Dose');
const Medication = require('../models/Medication');
const { RewardService } = require('../services/reward');

// Initialize reward service
const rewardService = new RewardService();

// Routes
router.get('/upcoming', auth, async (req, res) => {   // ✅ use auth directly
    try {
        const userId = req.userId;
        const now = new Date();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const doses = await Dose.find({
            userId,
            scheduledTime: { $gte: now, $lte: endOfDay },
            status: 'pending'
        }).populate('medication', 'name dosage instructions')
          .sort('scheduledTime');

        res.json(doses);
    } catch (error) {
        console.error('Get upcoming doses error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/history', auth, async (req, res) => {
    try {
        const userId = req.userId;
        const { month } = req.query;
        const monthDate = month ? new Date(`${month}-01T00:00:00.000Z`) : new Date();

        if (Number.isNaN(monthDate.getTime())) {
            return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM.' });
        }

        const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

        const doses = await Dose.find({
            userId,
            scheduledTime: { $gte: startOfMonth, $lte: endOfMonth }
        })
            .select('scheduledTime actualTime status')
            .sort({ scheduledTime: 1 });

        res.json({ doses });
    } catch (error) {
        console.error('Get dose history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

// @route   POST /api/doses/:id/take
// @desc    Mark dose as taken
// @access  Private
router.post('/:id/take', auth, async (req, res) => {
    try {
        const dose = await Dose.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!dose) {
            return res.status(404).json({ error: 'Dose not found' });
        }

        // Mark dose as taken
        dose.status = 'taken';
        dose.takenTime = new Date();
        await dose.save();

        // Award points for taking dose
        let rewardResult = null;
        try {
            rewardResult = await rewardService.awardDosePoints(req.user.id, dose._id);
        } catch (rewardError) {
            console.error('Error awarding points:', rewardError);
            // Don't fail the dose marking if reward service fails
        }

        res.json({ 
            message: 'Dose marked as taken', 
            dose,
            reward: rewardResult 
        });
    } catch (error) {
        console.error('Mark dose taken error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/doses/:id/miss
// @desc    Mark dose as missed
// @access  Private
router.post('/:id/miss', auth, async (req, res) => {
    try {
        const dose = await Dose.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!dose) {
            return res.status(404).json({ error: 'Dose not found' });
        }

        dose.status = 'missed';
        await dose.save();

        res.json({ message: 'Dose marked as missed', dose });
    } catch (error) {
        console.error('Mark dose missed error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
