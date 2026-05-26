const User = require('../models/User');
const Reward = require('../models/Reward');
const { RewardService } = require('../services/reward');

// Initialize the service
const rewardService = new RewardService();

const premiumRewards = [
    {
        id: 'advanced_analytics_7d',
        title: 'Advanced Analytics Plus',
        category: 'Analytics',
        description: 'Unlock deeper adherence trends, consistency score, and medication pattern insights for 7 days.',
        pointsRequired: 10,
        accessType: '7 days',
        durationDays: 7,
        benefit: 'Advanced charts and insights'
    },
    {
        id: 'ai_health_insights_7d',
        title: 'AI Health Insights Plus',
        category: 'AI',
        description: 'Unlock personalized weekly health suggestions, missed-dose pattern notes, and doctor visit prompts for 7 days.',
        pointsRequired: 20,
        accessType: '7 days',
        durationDays: 7,
        benefit: 'Premium AI guidance'
    },
    {
        id: 'health_report_export',
        title: 'Health Report Export',
        category: 'Reports',
        description: 'Unlock one premium downloadable health report with medication history, adherence summary, and appointments.',
        pointsRequired: 20,
        accessType: 'One report',
        durationDays: 0,
        benefit: 'PDF health report'
    },
    {
        id: 'emergency_card_lifetime',
        title: 'Emergency Medical Card',
        category: 'Safety',
        description: 'Unlock a shareable emergency card with medicines, allergies, conditions, and emergency contact details.',
        pointsRequired: 40,
        accessType: 'Lifetime',
        durationDays: null,
        benefit: 'Shareable emergency card'
    },
    {
        id: 'appointment_discount_voucher',
        title: 'Appointment Discount Voucher',
        category: 'Appointments',
        description: 'Unlock a voucher that can be used as an appointment fee discount in the next payment flow.',
        pointsRequired: 50,
        accessType: 'One appointment',
        durationDays: 30,
        benefit: 'Appointment fee discount'
    }
];

const buildPremiumRewardsPayload = async (userId, currentPoints) => {
    const unlockRecords = await Reward.find({
        userId,
        redeemed: true,
        'metadata.premiumFeatureId': { $exists: true }
    }).sort({ redeemedAt: -1 });

    const now = new Date();
    const unlockLookup = new Map();
    unlockRecords.forEach((record) => {
        const featureId = record.metadata?.premiumFeatureId;
        if (!featureId || unlockLookup.has(featureId)) return;

        const accessUntil = record.metadata?.accessUntil || null;
        const isActive = !accessUntil || accessUntil >= now;

        unlockLookup.set(featureId, {
            isUnlocked: isActive,
            unlockedAt: record.redeemedAt,
            accessUntil,
            rewardId: record._id
        });
    });

    const features = premiumRewards.map((feature) => {
        const unlock = unlockLookup.get(feature.id);
        return {
            ...feature,
            isUnlocked: Boolean(unlock?.isUnlocked),
            unlockedAt: unlock?.unlockedAt || null,
            accessUntil: unlock?.accessUntil || null,
            canUnlock: currentPoints >= feature.pointsRequired && !unlock?.isUnlocked,
            pointsShort: Math.max(feature.pointsRequired - currentPoints, 0)
        };
    });

    return {
        currentPoints,
        features,
        unlockedFeatures: features.filter((feature) => feature.isUnlocked),
        unlockableFeatures: features.filter((feature) => feature.canUnlock)
    };
};

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

        const currentPoints = user.rewardPoints || 0;
        const partnerOffers = await rewardService.getPartnerOffers(currentPoints);

        const allOffers = partnerOffers
            .map((offer) => ({
                ...offer,
                canRedeem: currentPoints >= offer.pointsRequired,
                pointsShort: Math.max(offer.pointsRequired - currentPoints, 0)
            }))
            .sort((a, b) => a.pointsRequired - b.pointsRequired);

        const availableOffers = allOffers.filter((offer) => offer.canRedeem);

        // Get redeemed offers
        const redeemedOffers = await Reward.find({
            userId: req.user.id,
            'partnerOffer.partnerId': { $exists: true },
            redeemed: true
        })
        .select('partnerOffer redeemedAt createdAt');

        res.json({
            currentPoints,
            allOffers,
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

exports.getPremiumRewards = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('rewardPoints');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const payload = await buildPremiumRewardsPayload(req.user.id, user.rewardPoints || 0);
        res.json(payload);
    } catch (error) {
        console.error('Get premium rewards error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.unlockPremiumReward = async (req, res) => {
    try {
        const { featureId } = req.params;
        const feature = premiumRewards.find((item) => item.id === featureId);

        if (!feature) {
            return res.status(404).json({ error: 'Premium feature not found' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentPayload = await buildPremiumRewardsPayload(req.user.id, user.rewardPoints || 0);
        const currentFeature = currentPayload.features.find((item) => item.id === featureId);

        if (currentFeature?.isUnlocked) {
            return res.status(400).json({ error: 'This premium feature is already unlocked' });
        }

        if ((user.rewardPoints || 0) < feature.pointsRequired) {
            return res.status(400).json({
                error: `Insufficient points. Required: ${feature.pointsRequired}, Available: ${user.rewardPoints || 0}`
            });
        }

        const accessUntil =
            typeof feature.durationDays === 'number' && feature.durationDays > 0
                ? new Date(Date.now() + feature.durationDays * 24 * 60 * 60 * 1000)
                : null;

        user.rewardPoints = (user.rewardPoints || 0) - feature.pointsRequired;
        await user.save();

        const reward = await Reward.create({
            userId: req.user.id,
            points: -feature.pointsRequired,
            type: 'redemption',
            description: `Unlocked premium feature: ${feature.title}`,
            redeemed: true,
            redeemedAt: new Date(),
            metadata: {
                premiumFeatureId: feature.id,
                premiumFeatureName: feature.title,
                accessUntil,
                accessType: feature.accessType
            }
        });

        const payload = await buildPremiumRewardsPayload(req.user.id, user.rewardPoints || 0);

        res.json({
            message: `${feature.title} unlocked successfully`,
            feature: {
                ...feature,
                isUnlocked: true,
                unlockedAt: reward.redeemedAt,
                accessUntil
            },
            remainingPoints: user.rewardPoints || 0,
            rewards: payload
        });
    } catch (error) {
        console.error('Unlock premium reward error:', error);
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
