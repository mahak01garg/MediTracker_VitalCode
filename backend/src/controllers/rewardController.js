const User = require('../models/User');
const Reward = require('../models/Reward');
const { RewardService } = require('../services/reward');

// Initialize the service
const rewardService = new RewardService();

exports.getPoints = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('rewardPoints badges streaks');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get reward history
        const rewards = await Reward.find({
            userId: req.user.id
        })
        .sort({ createdAt: -1 })
        .limit(10);

        // Calculate points breakdown
        const pointsByType = await Reward.aggregate([
            { $match: { userId: req.user.id } },
            { $group: { 
                _id: '$type', 
                totalPoints: { $sum: '$points' } 
            }}
        ]);

        res.json({
            totalPoints: user.rewardPoints || 0,
            badges: user.badges || [],
            streak: user.streaks?.current || 0,
            longestStreak: user.streaks?.longest || 0,
            recentRewards: rewards,
            pointsBreakdown: pointsByType
        });
    } catch (error) {
        console.error('Get points error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getBadges = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('badges');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userBadges = user.badges || [];

        // Define all possible badges
        const allBadges = [
            {
                id: 'first_dose',
                name: 'First Dose',
                description: 'Logged your first medication dose',
                icon: '🎯',
                earned: userBadges.some(b => b.name === 'first_dose')
            },
            {
                id: '7_day_streak',
                name: 'Week Warrior',
                description: '7-day medication streak',
                icon: '🔥',
                earned: userBadges.some(b => b.name === '7_day_streak')
            },
            {
                id: '30_day_streak',
                name: 'Month Master',
                description: '30-day medication streak',
                icon: '🏆',
                earned: userBadges.some(b => b.name === '30_day_streak')
            },
            {
                id: 'perfect_week',
                name: 'Perfect Week',
                description: 'No missed doses for a week',
                icon: '⭐',
                earned: userBadges.some(b => b.name === 'perfect_week')
            },
            {
                id: 'medication_completed',
                name: 'Course Completed',
                description: 'Completed a medication course',
                icon: '✅',
                earned: userBadges.some(b => b.name === 'medication_completed')
            },
            {
                id: 'health_tracker',
                name: 'Health Tracker',
                description: 'Logged 10 health entries',
                icon: '📊',
                earned: userBadges.some(b => b.name === 'health_tracker')
            },
            {
                id: 'early_bird',
                name: 'Early Bird',
                description: 'Took medication before 8 AM for 5 days',
                icon: '🐦',
                earned: userBadges.some(b => b.name === 'early_bird')
            },
            {
                id: 'consistent',
                name: 'Mr. Consistent',
                description: '95%+ adherence rate for a month',
                icon: '🎖️',
                earned: userBadges.some(b => b.name === 'consistent')
            }
        ];

        const earnedBadges = allBadges.filter(b => b.earned);
        const unearnedBadges = allBadges.filter(b => !b.earned);

        res.json({
            totalBadges: earnedBadges.length,
            earnedBadges,
            unearnedBadges,
            progress: Math.round((earnedBadges.length / allBadges.length) * 100)
        });
    } catch (error) {
        console.error('Get badges error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getPartnerOffers = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('rewardPoints');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get offers from service
        const partnerOffers = await rewardService.getPartnerOffers(user.rewardPoints || 0);

        // Filter offers user can afford
        const availableOffers = partnerOffers.filter(offer => 
            (user.rewardPoints || 0) >= offer.pointsRequired
        );

        // Sort by points required (lowest first)
        availableOffers.sort((a, b) => a.pointsRequired - b.pointsRequired);

        // Get redeemed offers
        const redeemedOffers = await Reward.find({
            userId: req.user.id,
            'partnerOffer.partnerId': { $exists: true },
            redeemed: true
        })
        .select('partnerOffer redeemedAt createdAt');

        res.json({
            currentPoints: user.rewardPoints || 0,
            availableOffers,
            redeemedOffers,
            totalOffers: partnerOffers.length,
            affordableOffers: availableOffers.length
        });
    } catch (error) {
        console.error('Get partner offers error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.redeemOffer = async (req, res) => {
    try {
        const { offerId } = req.params;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get offer details from service
        const partnerOffers = await rewardService.getPartnerOffers(user.rewardPoints || 0);
        const offer = partnerOffers.find(o => o.id === offerId);
        
        if (!offer) {
            return res.status(404).json({ error: 'Offer not found' });
        }

        // Use service to redeem points
        const result = await rewardService.redeemPoints(req.user.id, offerId, offer);

        res.json({
            message: 'Offer redeemed successfully!',
            offer: {
                ...offer,
                discountCode: result.discountCode,
                redemptionDate: new Date()
            },
            remainingPoints: result.remainingPoints
        });
    } catch (error) {
        console.error('Redeem offer error:', error);
        if (error.message.includes('Insufficient points') || error.message.includes('already redeemed')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        // Get top 10 users by streak
        const streakLeaders = await User.find({})
            .select('name streaks rewardPoints')
            .sort({ 'streaks.current': -1 })
            .limit(10);

        // Get top 10 users by points
        const pointsLeaders = await User.find({})
            .select('name streaks rewardPoints')
            .sort({ rewardPoints: -1 })
            .limit(10);

        // Get current user's rank
        const currentUser = await User.findById(req.user.id)
            .select('name streaks rewardPoints');

        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate streak rank
        const streakRank = await User.countDocuments({
            'streaks.current': { $gt: currentUser.streaks?.current || 0 }
        }) + 1;

        // Calculate points rank
        const pointsRank = await User.countDocuments({
            rewardPoints: { $gt: currentUser.rewardPoints || 0 }
        }) + 1;

        // Format leaderboard data
        const formatLeaderboard = (users, type) => {
            return users.map((user, index) => ({
                rank: index + 1,
                name: user.name,
                value: type === 'streak' ? (user.streaks?.current || 0) : (user.rewardPoints || 0),
                type: type === 'streak' ? 'days' : 'points',
                isCurrentUser: user._id.toString() === req.user.id
            }));
        };

        res.json({
            currentUser: {
                name: currentUser.name,
                streak: currentUser.streaks?.current || 0,
                points: currentUser.rewardPoints || 0,
                streakRank,
                pointsRank
            },
            streakLeaderboard: formatLeaderboard(streakLeaders, 'streak'),
            pointsLeaderboard: formatLeaderboard(pointsLeaders, 'points'),
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getRewardHistory = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20,
            type 
        } = req.query;

        const query = { userId: req.user.id };
        
        if (type) {
            query.type = type;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [rewards, total] = await Promise.all([
            Reward.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Reward.countDocuments(query)
        ]);

        // Calculate summary
        const totalPointsEarned = await Reward.aggregate([
            { $match: { userId: req.user.id, points: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$points' } } }
        ]);

        const totalPointsRedeemed = await Reward.aggregate([
            { $match: { userId: req.user.id, points: { $lt: 0 } } },
            { $group: { _id: null, total: { $sum: '$points' } } }
        ]);

        res.json({
            rewards,
            summary: {
                totalPointsEarned: totalPointsEarned[0]?.total || 0,
                totalPointsRedeemed: Math.abs(totalPointsRedeemed[0]?.total || 0),
                netPoints: (totalPointsEarned[0]?.total || 0) + (totalPointsRedeemed[0]?.total || 0)
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get reward history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};