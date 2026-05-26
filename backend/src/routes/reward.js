const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const {auth,firebaseAuth} = require('../middleware/auth');

router.use(auth);

router.get('/points', rewardController.getPoints);
router.get('/badges', rewardController.getBadges);
router.get('/offers', rewardController.getPartnerOffers);
router.post('/redeem/:offerId', rewardController.redeemOffer);
router.get('/premium', rewardController.getPremiumRewards);
router.post('/premium/unlock/:featureId', rewardController.unlockPremiumReward);
router.get('/leaderboard', rewardController.getLeaderboard);
router.get('/history', rewardController.getRewardHistory);

module.exports = router;
