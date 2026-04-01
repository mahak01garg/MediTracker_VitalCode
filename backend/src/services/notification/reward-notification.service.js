const emailService = require('./email');

class RewardNotificationService {
    /**
     * Send notification when points are earned
     */
    async sendPointsEarnedNotification(userEmail, userName, rewardData) {
        const subject = `🎉 You've earned ${rewardData.points} points!`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .reward-box { background: white; border: 2px dashed #f6d365; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
                    .points { font-size: 48px; color: #fda085; font-weight: bold; margin: 10px 0; }
                    .button { display: inline-block; padding: 12px 30px; background: #fda085; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .badge { display: inline-block; background: #e8f4ff; padding: 8px 15px; border-radius: 20px; margin: 5px; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Reward Unlocked!</h1>
                    </div>
                    <div class="content">
                        <h2>Great job, ${userName}! 👏</h2>
                        <p>You've been rewarded for staying consistent with your health journey.</p>
                        
                        <div class="reward-box">
                            <h3>You earned</h3>
                            <div class="points">+${rewardData.points} points</div>
                            <p><strong>Reason:</strong> ${rewardData.reason}</p>
                            <p><strong>Total Points:</strong> ${rewardData.totalPoints}</p>
                        </div>
                        
                        ${rewardData.badges && rewardData.badges.length > 0 ? `
                        <h3>🏅 New Badge Earned!</h3>
                        <div style="margin: 20px 0;">
                            ${rewardData.badges.map(badge => `
                                <span class="badge">${badge.title}</span>
                            `).join('')}
                        </div>
                        ` : ''}
                        
                        ${rewardData.bonuses && rewardData.bonuses.length > 0 ? `
                        <h3>✨ Bonus Breakdown:</h3>
                        <ul style="list-style: none; padding: 0;">
                            ${rewardData.bonuses.map(bonus => `
                                <li style="padding: 5px 0;">${bonus.type}: +${bonus.points} points</li>
                            `).join('')}
                        </ul>
                        ` : ''}
                        
                        <h3>💰 Redeem Your Points:</h3>
                        <p>Use your points to get discounts on medications, health products, and more!</p>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/rewards" class="button">View Rewards & Offers</a>
                        </div>
                        
                        <p>Keep up the great work! Your health journey matters. 💪</p>
                        <p>The Meditracker Team</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Reward Unlocked! 🎉
===================

Great job, ${userName}! 👏

You've been rewarded for staying consistent with your health journey.

You earned: +${rewardData.points} points
Reason: ${rewardData.reason}
Total Points: ${rewardData.totalPoints}

${rewardData.badges && rewardData.badges.length > 0 ? `
🏅 New Badge(s) Earned:
${rewardData.badges.map(badge => `• ${badge.title}: ${badge.description}`).join('\n')}
` : ''}

${rewardData.bonuses && rewardData.bonuses.length > 0 ? `
✨ Bonus Breakdown:
${rewardData.bonuses.map(bonus => `• ${bonus.type}: +${bonus.points} points`).join('\n')}
` : ''}

💰 Redeem Your Points:
Use your points to get discounts on medications, health products, and more!

View Rewards: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/rewards

Keep up the great work! Your health journey matters. 💪

The Meditracker Team
        `;

        return await emailService.sendEmail(userEmail, subject, html, text);
    }

    /**
     * Send notification when badge is earned
     */
    async sendBadgeEarnedNotification(userEmail, userName, badgeData) {
        const subject = `🏅 New Badge Earned: ${badgeData.title}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .badge-box { background: white; border: 3px solid #7c3aed; padding: 30px; text-align: center; margin: 20px 0; border-radius: 15px; }
                    .badge-icon { font-size: 60px; margin: 10px 0; }
                    .badge-title { font-size: 28px; color: #7c3aed; margin: 10px 0; }
                    .button { display: inline-block; padding: 12px 30px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏅 Achievement Unlocked!</h1>
                    </div>
                    <div class="content">
                        <h2>Congratulations, ${userName}! 🎊</h2>
                        <p>You've earned a new badge for your dedication to health management.</p>
                        
                        <div class="badge-box">
                            <div class="badge-icon">${badgeData.icon || '🏆'}</div>
                            <div class="badge-title">${badgeData.title}</div>
                            <p>${badgeData.description}</p>
                            <p><strong>Points Awarded:</strong> +${badgeData.points || 25}</p>
                            <p><strong>Earned On:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>
                        
                        <h3>🌟 What This Means:</h3>
                        <p>This badge represents your commitment to maintaining a healthy lifestyle through consistent medication management.</p>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" class="button">View Your Badges</a>
                        </div>
                        
                        <p>Only ${badgeData.rarity || '10%'} of users have earned this badge!</p>
                        
                        <p>Keep up the amazing work! Your consistency inspires others. 🌟</p>
                        <p>The Meditracker Team</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Achievement Unlocked! 🏅
========================

Congratulations, ${userName}! 🎊

You've earned a new badge for your dedication to health management.

${badgeData.icon || '🏆'} ${badgeData.title}
${badgeData.description}

Points Awarded: +${badgeData.points || 25}
Earned On: ${new Date().toLocaleDateString()}

🌟 What This Means:
This badge represents your commitment to maintaining a healthy lifestyle through consistent medication management.

View Your Badges: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile

Only ${badgeData.rarity || '10%'} of users have earned this badge!

Keep up the amazing work! Your consistency inspires others. 🌟

The Meditracker Team
        `;

        return await emailService.sendEmail(userEmail, subject, html, text);
    }

    /**
     * Send notification when offer is redeemed
     */
    async sendOfferRedeemedNotification(userEmail, userName, offerData) {
        const subject = `✅ Offer Redeemed: ${offerData.title}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #4cd964 0%, #5ac8fa 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .offer-box { background: white; border: 2px solid #4cd964; padding: 20px; border-radius: 10px; margin: 20px 0; }
                    .code-box { background: #e8f5e9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0; border-radius: 5px; }
                    .button { display: inline-block; padding: 12px 30px; background: #5ac8fa; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Offer Successfully Redeemed!</h1>
                    </div>
                    <div class="content">
                        <h2>Congratulations, ${userName}! 🎉</h2>
                        <p>Your reward points have been redeemed for an exclusive offer.</p>
                        
                        <div class="offer-box">
                            <h3>${offerData.title}</h3>
                            <p><strong>Partner:</strong> ${offerData.partner}</p>
                            <p>${offerData.description}</p>
                            <p><strong>Points Used:</strong> ${offerData.pointsRequired}</p>
                            <p><strong>Valid Until:</strong> ${new Date(offerData.validUntil).toLocaleDateString()}</p>
                        </div>
                        
                        <div class="code-box">
                            ${offerData.discountCode}
                        </div>
                        
                        <h3>📋 How to Use:</h3>
                        <ol>
                            <li>Copy the discount code above</li>
                            <li>Visit ${offerData.partner} website/store</li>
                            <li>Apply the code at checkout</li>
                            <li>Enjoy your discount!</li>
                        </ol>
                        
                        <p><strong>Remaining Points:</strong> ${offerData.remainingPoints}</p>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/rewards" class="button">View More Offers</a>
                        </div>
                        
                        <p>Thank you for being a consistent Meditracker user! 💪</p>
                        <p>The Meditracker Team</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Offer Successfully Redeemed! ✅
===============================

Congratulations, ${userName}! 🎉

Your reward points have been redeemed for an exclusive offer.

${offerData.title}
Partner: ${offerData.partner}
${offerData.description}

Points Used: ${offerData.pointsRequired}
Valid Until: ${new Date(offerData.validUntil).toLocaleDateString()}

📋 Discount Code: ${offerData.discountCode}

How to Use:
1. Copy the discount code above
2. Visit ${offerData.partner} website/store
3. Apply the code at checkout
4. Enjoy your discount!

Remaining Points: ${offerData.remainingPoints}

View More Offers: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/rewards

Thank you for being a consistent Meditracker user! 💪

The Meditracker Team
        `;

        return await emailService.sendEmail(userEmail, subject, html, text);
    }

    /**
     * Send streak milestone notification
     */
    async sendStreakMilestoneNotification(userEmail, userName, streakData) {
        const subject = `🔥 ${streakData.days}-Day Streak Milestone!`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .streak-box { background: white; padding: 30px; text-align: center; margin: 20px 0; border-radius: 10px; border: 3px solid #ff6b6b; }
                    .streak-days { font-size: 72px; color: #ff6b6b; font-weight: bold; margin: 0; }
                    .button { display: inline-block; padding: 12px 30px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔥 Streak Milestone Achieved!</h1>
                    </div>
                    <div class="content">
                        <h2>Amazing work, ${userName}! 🚀</h2>
                        <p>You've reached an incredible medication adherence milestone.</p>
                        
                        <div class="streak-box">
                            <div class="streak-days">${streakData.days}</div>
                            <h3>CONSECUTIVE DAYS</h3>
                            <p>of perfect medication adherence</p>
                            <p><strong>Points Earned:</strong> +${streakData.points}</p>
                        </div>
                        
                        <h3>🌟 Health Benefits:</h3>
                        <ul>
                            <li>Better treatment outcomes</li>
                            <li>Improved overall health</li>
                            <li>Reduced complications</li>
                            <li>Stronger immune system</li>
                        </ul>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">Continue Your Streak</a>
                        </div>
                        
                        <p><strong>Next Milestone:</strong> ${streakData.nextMilestone} days (${streakData.daysToNext} more days)</p>
                        
                        <p>You're doing an incredible job! Keep it up! 🔥</p>
                        <p>The Meditracker Team</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const text = `
Streak Milestone Achieved! 🔥
============================

Amazing work, ${userName}! 🚀

You've reached an incredible medication adherence milestone.

${streakData.days} CONSECUTIVE DAYS
of perfect medication adherence

Points Earned: +${streakData.points}

🌟 Health Benefits:
• Better treatment outcomes
• Improved overall health
• Reduced complications
• Stronger immune system

Continue Your Streak: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard

Next Milestone: ${streakData.nextMilestone} days (${streakData.daysToNext} more days)

You're doing an incredible job! Keep it up! 🔥

The Meditracker Team
        `;

        return await emailService.sendEmail(userEmail, subject, html, text);
    }
}

module.exports = new RewardNotificationService();