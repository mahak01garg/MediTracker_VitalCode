const User = require('../../models/User');
const Reward = require('../../models/Reward');
const Dose = require('../../models/Dose');
const HealthEntry = require('../../models/HealthEntry');
const Medication = require('../../models/Medication');
const emailService = require('../notification/EmailService');

class RewardService {
  constructor() {
    this.pointConfig = {
      doseTaken: 10,
      firstDoseBonus: 15,
      earlyBirdBonus: 5,
      healthEntry: 5,
      comprehensiveHealthEntry: 5,
      medicationCompletion: 100,
      streakBonus: {
        3: 10,
        7: 15,
        14: 20,
        30: 30
      },
      perfectWeekBonus: 50
    };
  }

  /**
   * Award points for taking a dose
   */
  async awardDosePoints(userId, doseId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const dose = await Dose.findById(doseId);
      if (!dose) throw new Error('Dose not found');

      let points = this.pointConfig.doseTaken;
      const bonuses = [];
      const newlyEarnedBadges = [];

      // Check if it's the first dose ever
      const doseCount = await Dose.countDocuments({ userId });
      if (doseCount === 1) {
        points += this.pointConfig.firstDoseBonus;
        bonuses.push({ type: 'FIRST_DOSE', points: this.pointConfig.firstDoseBonus });
        await this.awardBadge(userId, 'first_dose');
        newlyEarnedBadges.push({ title: 'First Dose', description: 'Logged your first medication dose' });
      }

      // Check time-based bonus (Early Bird)
      const doseHour = new Date(dose.takenAt).getHours();
      if (doseHour >= 5 && doseHour <= 8) {
        points += this.pointConfig.earlyBirdBonus;
        bonuses.push({ type: 'EARLY_BIRD', points: this.pointConfig.earlyBirdBonus });
      }

      // Update user streak and calculate streak bonus
      const streakResult = await this.updateUserStreak(userId);
      if (streakResult.bonus > 0) {
        points += streakResult.bonus;
        bonuses.push({ type: 'STREAK_BONUS', points: streakResult.bonus });
      }

      // Check for perfect week
      const perfectWeekBonus = await this.checkPerfectWeek(userId);
      if (perfectWeekBonus > 0) {
        points += perfectWeekBonus;
        bonuses.push({ type: 'PERFECT_WEEK', points: perfectWeekBonus });
        await this.awardBadge(userId, 'perfect_week');
        newlyEarnedBadges.push({ title: 'Perfect Week', description: 'No missed doses for a week' });
      }

      // Award points
      const oldPoints = user.rewardPoints || 0;
      user.rewardPoints = oldPoints + points;
      user.totalDosesTaken = (user.totalDosesTaken || 0) + 1;
      await user.save();

      // Create reward record
      const reward = new Reward({
        userId,
        points,
        type: 'dose_taken',
        description: `Points for taking medication dose`,
        metadata: {
          doseId: dose._id,
          medicationId: dose.medicationId,
          takenAt: dose.takenAt,
          bonuses
        }
      });

      await reward.save();

      // Check for streak badges
      const streakBadges = await this.checkStreakBadges(userId, streakResult.streak);
      if (streakBadges.length > 0) {
        newlyEarnedBadges.push(...streakBadges);
      }

      // Send email notification (async - don't wait for it)
      if (user.email) {
        this.sendRewardEmail(user, {
          points,
          reason: 'Taking medication on time',
          oldPoints,
          newPoints: user.rewardPoints,
          bonuses,
          badges: newlyEarnedBadges,
          streak: streakResult.streak
        }).catch(err => console.error('Error sending reward email:', err));
      }

      return {
        points,
        totalPoints: user.rewardPoints,
        streak: streakResult.streak,
        bonuses,
        badges: newlyEarnedBadges,
        rewardId: reward._id
      };
    } catch (error) {
      console.error('Error in awardDosePoints:', error);
      throw new Error(`Error awarding dose points: ${error.message}`);
    }
  }

  /**
   * Update user streak and return bonus points
   */
  async updateUserStreak(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { streak: 0, bonus: 0 };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if user took a dose yesterday
      const yesterdayDose = await Dose.findOne({
        userId,
        takenAt: {
          $gte: yesterday,
          $lt: today
        }
      });

      if (yesterdayDose) {
        user.streaks.current = (user.streaks.current || 0) + 1;
      } else {
        user.streaks.current = 1;
      }

      // Update longest streak
      if (user.streaks.current > (user.streaks.longest || 0)) {
        user.streaks.longest = user.streaks.current;
      }

      await user.save();

      // Calculate streak bonus
      const bonus = this.calculateStreakBonus(user.streaks.current);

      return {
        streak: user.streaks.current,
        bonus
      };
    } catch (error) {
      console.error('Error updating streak:', error);
      return { streak: 0, bonus: 0 };
    }
  }

  /**
   * Calculate bonus points based on streak
   */
  calculateStreakBonus(streak) {
    if (streak >= 30) return this.pointConfig.streakBonus[30];
    if (streak >= 14) return this.pointConfig.streakBonus[14];
    if (streak >= 7) return this.pointConfig.streakBonus[7];
    if (streak >= 3) return this.pointConfig.streakBonus[3];
    return 0;
  }

  /**
   * Check and award streak badges
   */
  async checkStreakBadges(userId, streak) {
    const earnedBadges = [];
    try {
      if (streak >= 7) {
        await this.awardBadge(userId, '7_day_streak');
        earnedBadges.push({ title: 'Week Warrior', description: '7-day medication streak' });
      }
      if (streak >= 30) {
        await this.awardBadge(userId, '30_day_streak');
        earnedBadges.push({ title: 'Month Master', description: '30-day medication streak' });
      }

      // Check for Early Bird badge (medication before 8 AM for 5 days)
      if (streak >= 5) {
        const earlyDoses = await Dose.countDocuments({
          userId,
          takenAt: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 5))
          },
          $expr: {
            $lt: [{ $hour: "$takenAt" }, 8]
          }
        });

        if (earlyDoses >= 5) {
          await this.awardBadge(userId, 'early_bird');
          earnedBadges.push({ title: 'Early Bird', description: 'Took medication before 8 AM for 5 days' });
        }
      }
    } catch (error) {
      console.error('Error checking streak badges:', error);
    }
    return earnedBadges;
  }

  /**
   * Check for perfect week (no missed doses)
   */
  async checkPerfectWeek(userId) {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get all medications for user
      const medications = await Medication.find({ userId });
      
      // For each medication, check if all doses were taken
      let perfectWeek = true;
      let totalBonus = 0;

      for (const medication of medications) {
        const scheduledDoses = await this.getScheduledDosesForWeek(medication._id, weekAgo);
        const takenDoses = await Dose.countDocuments({
          medicationId: medication._id,
          takenAt: { $gte: weekAgo },
          status: 'taken'
        });

        if (takenDoses === scheduledDoses) {
          totalBonus += 20; // Bonus for each medication with perfect adherence
        } else {
          perfectWeek = false;
        }
      }

      return perfectWeek ? totalBonus + this.pointConfig.perfectWeekBonus : totalBonus;
    } catch (error) {
      console.error('Error checking perfect week:', error);
      return 0;
    }
  }

  /**
   * Award points for health entry
   */
  async awardHealthEntryPoints(userId, healthEntryId) {
    try {
      const user = await User.findById(userId);
      const healthEntry = await HealthEntry.findById(healthEntryId);

      if (!user || !healthEntry) {
        throw new Error('User or health entry not found');
      }

      let points = this.pointConfig.healthEntry;
      const bonuses = [];

      // Count health entries
      const healthEntryCount = await HealthEntry.countDocuments({ userId });
      
      if (healthEntryCount >= 10) {
        await this.awardBadge(userId, 'health_tracker');
      }

      // Bonus for comprehensive entry
      if (healthEntry.bloodPressure || healthEntry.bloodSugar || healthEntry.notes) {
        points += this.pointConfig.comprehensiveHealthEntry;
        bonuses.push({ type: 'COMPREHENSIVE_ENTRY', points: this.pointConfig.comprehensiveHealthEntry });
      }

      // Award points
      const oldPoints = user.rewardPoints || 0;
      user.rewardPoints = oldPoints + points;
      user.totalHealthEntries = (user.totalHealthEntries || 0) + 1;
      await user.save();

      // Create reward record
      const reward = new Reward({
        userId,
        points,
        type: 'bonus',
        description: `Points for logging health data`,
        metadata: {
          healthEntryId: healthEntry._id,
          entryType: healthEntry.type,
          bonuses
        }
      });

      await reward.save();

      // Send email notification for health entry
      if (user.email && points > 0) {
        this.sendRewardEmail(user, {
          points,
          reason: 'Logging health data',
          oldPoints,
          newPoints: user.rewardPoints,
          bonuses,
          healthEntryCount
        }).catch(err => console.error('Error sending health reward email:', err));
      }

      return {
        points,
        totalPoints: user.rewardPoints,
        healthEntryCount,
        bonuses
      };
    } catch (error) {
      console.error('Error in awardHealthEntryPoints:', error);
      throw new Error(`Error awarding health entry points: ${error.message}`);
    }
  }

  /**
   * Award badge to user
   */
  async awardBadge(userId, badgeId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Initialize badges array if not exists
      if (!user.badges) user.badges = [];

      // Check if badge already awarded
      const alreadyHasBadge = user.badges.some(b => b.name === badgeId);
      if (alreadyHasBadge) return;

      // Define badges
      const badgeDefinitions = {
        'first_dose': {
          name: 'first_dose',
          title: 'First Dose',
          description: 'Logged your first medication dose',
          icon: '🎯',
          awardedAt: new Date()
        },
        '7_day_streak': {
          name: '7_day_streak',
          title: 'Week Warrior',
          description: '7-day medication streak',
          icon: '🔥',
          awardedAt: new Date()
        },
        '30_day_streak': {
          name: '30_day_streak',
          title: 'Month Master',
          description: '30-day medication streak',
          icon: '🏆',
          awardedAt: new Date()
        },
        'perfect_week': {
          name: 'perfect_week',
          title: 'Perfect Week',
          description: 'No missed doses for a week',
          icon: '⭐',
          awardedAt: new Date()
        },
        'medication_completed': {
          name: 'medication_completed',
          title: 'Course Completed',
          description: 'Completed a medication course',
          icon: '✅',
          awardedAt: new Date()
        },
        'health_tracker': {
          name: 'health_tracker',
          title: 'Health Tracker',
          description: 'Logged 10 health entries',
          icon: '📊',
          awardedAt: new Date()
        },
        'early_bird': {
          name: 'early_bird',
          title: 'Early Bird',
          description: 'Took medication before 8 AM for 5 days',
          icon: '🐦',
          awardedAt: new Date()
        },
        'consistent': {
          name: 'consistent',
          title: 'Mr. Consistent',
          description: '95%+ adherence rate for a month',
          icon: '🎖️',
          awardedAt: new Date()
        }
      };

      const badge = badgeDefinitions[badgeId];
      if (badge) {
        user.badges.push(badge);
        await user.save();

        // Award points for badge
        await this.awardBadgePoints(userId, badgeId);

        // Send badge earned email
        if (user.email) {
          this.sendBadgeEmail(user, badge).catch(err => 
            console.error('Error sending badge email:', err)
          );
        }
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
    }
  }

  /**
   * Award points for earning a badge
   */
  async awardBadgePoints(userId, badgeId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const badgePoints = {
        'first_dose': 25,
        '7_day_streak': 50,
        '30_day_streak': 100,
        'perfect_week': 75,
        'medication_completed': 150,
        'health_tracker': 50,
        'early_bird': 40,
        'consistent': 200
      };

      const points = badgePoints[badgeId] || 25;
      user.rewardPoints = (user.rewardPoints || 0) + points;
      await user.save();

      // Create reward record
      const reward = new Reward({
        userId,
        points,
        type: 'badge_earned',
        description: `Bonus points for earning badge: ${badgeId}`,
        metadata: {
          badgeId,
          badgePoints: points
        }
      });

      await reward.save();
    } catch (error) {
      console.error('Error awarding badge points:', error);
    }
  }

  /**
   * Award points for medication completion
   */
  async awardMedicationCompletion(userId, medicationId) {
    try {
      const user = await User.findById(userId);
      const medication = await Medication.findById(medicationId);

      if (!user || !medication) {
        throw new Error('User or medication not found');
      }

      const points = this.pointConfig.medicationCompletion;

      // Award points
      const oldPoints = user.rewardPoints || 0;
      user.rewardPoints = oldPoints + points;
      await user.save();

      // Create reward record
      const reward = new Reward({
        userId,
        points,
        type: 'medication_completed',
        description: `Completed medication course: ${medication.name}`,
        metadata: {
          medicationId: medication._id,
          medicationName: medication.name
        }
      });

      await reward.save();

      // Award badge
      await this.awardBadge(userId, 'medication_completed');

      // Check consistency badge
      const adherenceRate = await this.calculateAdherenceRate(userId);
      if (adherenceRate >= 95) {
        await this.awardBadge(userId, 'consistent');
      }

      // Send email notification
      if (user.email) {
        this.sendRewardEmail(user, {
          points,
          reason: `Completing medication: ${medication.name}`,
          oldPoints,
          newPoints: user.rewardPoints,
          medicationName: medication.name
        }).catch(err => console.error('Error sending medication completion email:', err));
      }

      return {
        points,
        totalPoints: user.rewardPoints,
        medicationName: medication.name
      };
    } catch (error) {
      console.error('Error in awardMedicationCompletion:', error);
      throw new Error(`Error awarding medication completion points: ${error.message}`);
    }
  }

  /**
   * Calculate medication adherence rate
   */
  async calculateAdherenceRate(userId) {
    try {
      const medications = await Medication.find({ userId });
      let totalScheduled = 0;
      let totalTaken = 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const medication of medications) {
        const scheduledDoses = await this.getScheduledDosesForPeriod(medication._id, thirtyDaysAgo, new Date());
        const takenDoses = await Dose.countDocuments({
          medicationId: medication._id,
          takenAt: { $gte: thirtyDaysAgo },
          status: 'taken'
        });

        totalScheduled += scheduledDoses;
        totalTaken += takenDoses;
      }

      return totalScheduled > 0 ? (totalTaken / totalScheduled) * 100 : 100;
    } catch (error) {
      console.error('Error calculating adherence rate:', error);
      return 0;
    }
  }

  /**
   * Get scheduled doses for a period
   */
  async getScheduledDosesForPeriod(medicationId, startDate, endDate) {
    const medication = await Medication.findById(medicationId);
    if (!medication) return 0;

    const frequency = medication.frequency || 1; // doses per day
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    return days * frequency;
  }

  /**
   * Get scheduled doses for a week
   */
  async getScheduledDosesForWeek(medicationId, startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    return this.getScheduledDosesForPeriod(medicationId, startDate, endDate);
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboardData(userId) {
    try {
      // Get top users by streak
      const streakLeaders = await User.find({})
        .select('name streaks rewardPoints')
        .sort({ 'streaks.current': -1 })
        .limit(10);

      // Get top users by points
      const pointsLeaders = await User.find({})
        .select('name streaks rewardPoints')
        .sort({ rewardPoints: -1 })
        .limit(10);

      // Get current user's rank
      const currentUser = await User.findById(userId)
        .select('name streaks rewardPoints');

      // Calculate ranks
      const streakRank = await User.countDocuments({
        'streaks.current': { $gt: currentUser?.streaks?.current || 0 }
      }) + 1;

      const pointsRank = await User.countDocuments({
        rewardPoints: { $gt: currentUser?.rewardPoints || 0 }
      }) + 1;

      return {
        streakLeaders,
        pointsLeaders,
        currentUser,
        streakRank,
        pointsRank
      };
    } catch (error) {
      console.error('Error in getLeaderboardData:', error);
      throw new Error(`Error getting leaderboard data: ${error.message}`);
    }
  }

  /**
   * Get reward summary
   */
  async getRewardSummary(userId) {
    try {
      const user = await User.findById(userId);
      
      // Get points by type
      const pointsByType = await Reward.aggregate([
        { $match: { userId } },
        { $group: { 
          _id: '$type', 
          totalPoints: { $sum: '$points' } 
        }}
      ]);

      // Calculate totals
      const totalPointsEarned = await Reward.aggregate([
        { $match: { userId, points: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]);

      const totalPointsRedeemed = await Reward.aggregate([
        { $match: { userId, points: { $lt: 0 } } },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]);

      // Get recent rewards
      const recentRewards = await Reward.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        user: {
          totalPoints: user?.rewardPoints || 0,
          currentStreak: user?.streaks?.current || 0,
          longestStreak: user?.streaks?.longest || 0,
          badges: user?.badges || []
        },
        summary: {
          pointsByType,
          totalPointsEarned: totalPointsEarned[0]?.total || 0,
          totalPointsRedeemed: Math.abs(totalPointsRedeemed[0]?.total || 0),
          netPoints: (totalPointsEarned[0]?.total || 0) + (totalPointsRedeemed[0]?.total || 0)
        },
        recentRewards
      };
    } catch (error) {
      console.error('Error in getRewardSummary:', error);
      throw new Error(`Error getting reward summary: ${error.message}`);
    }
  }

  /**
   * Redeem points for an offer
   */
  async redeemPoints(userId, offerId, offerData) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Check if user has enough points
      if (user.rewardPoints < offerData.pointsRequired) {
        throw new Error(`Insufficient points. Required: ${offerData.pointsRequired}, Available: ${user.rewardPoints}`);
      }

      // Check if already redeemed this offer
      const existingRedemption = await Reward.findOne({
        userId,
        'partnerOffer.partnerId': offerId,
        redeemed: true
      });

      if (existingRedemption) {
        throw new Error('You have already redeemed this offer');
      }

      // Deduct points
      const oldPoints = user.rewardPoints;
      user.rewardPoints -= offerData.pointsRequired;
      await user.save();

      // Generate unique discount code
      const discountCode = `OFFER${Date.now().toString().slice(-6)}`;

      // Create redemption record
      const reward = new Reward({
        userId,
        points: -offerData.pointsRequired,
        type: 'redemption',
        description: `Redeemed offer: ${offerData.title}`,
        redeemed: true,
        redeemedAt: new Date(),
        partnerOffer: {
          partnerId: offerId,
          partnerName: offerData.partner,
          discountCode: discountCode,
          discountAmount: offerData.pointsRequired
        }
      });

      await reward.save();

      // Send redemption confirmation email
      if (user.email) {
        this.sendRedemptionEmail(user, {
          ...offerData,
          discountCode,
          oldPoints,
          remainingPoints: user.rewardPoints
        }).catch(err => console.error('Error sending redemption email:', err));
      }

      return {
        success: true,
        remainingPoints: user.rewardPoints,
        discountCode,
        offer: offerData
      };
    } catch (error) {
      console.error('Error in redeemPoints:', error);
      throw new Error(`Error redeeming points: ${error.message}`);
    }
  }

  /**
   * Get all partner offers
   */
  async getPartnerOffers(userPoints) {
    // Mock partner offers - in production, these would come from a database
    return [
      {
        id: 'pharma_1',
        partner: 'MediPharma',
        title: '10% Off on Prescriptions',
        description: 'Get 10% discount on all prescription medications',
        pointsRequired: 100,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        logo: '💊'
      },
      {
        id: 'pharma_2',
        partner: 'HealthPlus',
        title: 'Free Delivery',
        description: 'Free home delivery on orders above ₹500',
        pointsRequired: 50,
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        logo: '🚚'
      },
      {
        id: 'wellness_1',
        partner: 'Wellness World',
        title: '20% Off Supplements',
        description: 'Discount on vitamins and supplements',
        pointsRequired: 150,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        logo: '💪'
      },
      {
        id: 'monitoring_1',
        partner: 'HealthTrack',
        title: 'Free BP Monitor',
        description: 'Get a free blood pressure monitor',
        pointsRequired: 500,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        logo: '❤️'
      }
    ];
  }

  /**
   * Send reward email notification
   */
  async sendRewardEmail(user, data) {
    const subject = `🎉 You've earned ${data.points} points!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .reward-box { background: white; border: 2px dashed #f6d365; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
          .points { font-size: 48px; color: #fda085; font-weight: bold; margin: 10px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #fda085; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Reward Unlocked!</h1>
        </div>
        <div class="content">
          <h2>Great job, ${user.name}! 👏</h2>
          
          <div class="reward-box">
            <h3>You earned</h3>
            <div class="points">+${data.points} points</div>
            <p><strong>Reason:</strong> ${data.reason}</p>
            <p><strong>Previous Points:</strong> ${data.oldPoints}</p>
            <p><strong>Total Points:</strong> ${data.newPoints}</p>
          </div>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/rewards" class="button">View Rewards</a>
          
          <p>Keep up the great work! 💪</p>
          <p>The Meditracker Team</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Reward Unlocked! 🎉
===================

Great job, ${user.name}! 👏

You've been rewarded for staying consistent with your health journey.

You earned: +${data.points} points
Reason: ${data.reason}
Previous Points: ${data.oldPoints}
Total Points: ${data.newPoints}

View Rewards: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/rewards

Keep up the great work! 💪

The Meditracker Team
    `;

    return await emailService.sendEmail(user.email, subject, html, text);
  }

  /**
   * Send badge earned email
   */
  async sendBadgeEmail(user, badge) {
    const subject = `🏅 New Badge Earned: ${badge.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .badge-box { background: white; border: 3px solid #7c3aed; padding: 30px; text-align: center; margin: 20px 0; border-radius: 15px; }
          .badge-icon { font-size: 60px; margin: 10px 0; }
          .badge-title { font-size: 28px; color: #7c3aed; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏅 Achievement Unlocked!</h1>
        </div>
        <div class="content">
          <h2>Congratulations, ${user.name}! 🎊</h2>
          
          <div class="badge-box">
            <div class="badge-icon">${badge.icon || '🏆'}</div>
            <div class="badge-title">${badge.title}</div>
            <p>${badge.description}</p>
          </div>
          
          <p>Keep up the amazing work! Your consistency inspires others. 🌟</p>
          <p>The Meditracker Team</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Achievement Unlocked! 🏅
========================

Congratulations, ${user.name}! 🎊

You've earned a new badge for your dedication to health management.

${badge.icon || '🏆'} ${badge.title}
${badge.description}

Keep up the amazing work! Your consistency inspires others. 🌟

The Meditracker Team
    `;

    return await emailService.sendEmail(user.email, subject, html, text);
  }

  /**
   * Send redemption confirmation email
   */
  async sendRedemptionEmail(user, data) {
    const subject = `✅ Offer Redeemed: ${data.title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #4cd964 0%, #5ac8fa 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .offer-box { background: white; border: 2px solid #4cd964; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .code-box { background: #e8f5e9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✅ Offer Successfully Redeemed!</h1>
        </div>
        <div class="content">
          <h2>Congratulations, ${user.name}! 🎉</h2>
          
          <div class="offer-box">
            <h3>${data.title}</h3>
            <p><strong>Partner:</strong> ${data.partner}</p>
            <p>${data.description}</p>
            <p><strong>Points Used:</strong> ${data.pointsRequired}</p>
            <p><strong>Valid Until:</strong> ${new Date(data.validUntil).toLocaleDateString()}</p>
          </div>
          
          <div class="code-box">
            ${data.discountCode}
          </div>
          
          <p><strong>Remaining Points:</strong> ${data.remainingPoints}</p>
          
          <p>Thank you for being a consistent Meditracker user! 💪</p>
          <p>The Meditracker Team</p>
        </div>
      </body>
      </html>
    `;

    const text = `
Offer Successfully Redeemed! ✅
===============================

Congratulations, ${user.name}! 🎉

${data.title}
Partner: ${data.partner}
${data.description}

Points Used: ${data.pointsRequired}
Valid Until: ${new Date(data.validUntil).toLocaleDateString()}

📋 Discount Code: ${data.discountCode}

Remaining Points: ${data.remainingPoints}

Thank you for being a consistent Meditracker user! 💪

The Meditracker Team
    `;

    return await emailService.sendEmail(user.email, subject, html, text);
  }
}

module.exports = RewardService;