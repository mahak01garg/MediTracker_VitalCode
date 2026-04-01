const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const {auth,firebaseAuth} = require('../middleware/auth');

router.use(auth);

router.post('/chat', aiController.chat);
router.get('/predictions', aiController.getMissedDosePredictions);
router.get('/summary/today', aiController.getTodaySummary);
router.get('/summary/week', aiController.getWeekSummary);
router.post('/medication-advice', aiController.getMedicationAdvice);

module.exports = router;