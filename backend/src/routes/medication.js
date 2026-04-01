const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const {auth,firebaseAuth} = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Medication CRUD
router.post('/', medicationController.createMedication);
router.get('/', medicationController.getMedications);
router.get('/:id', medicationController.getMedications);
router.put('/:id', medicationController.updateMedication);
router.delete('/:id', medicationController.deleteMedication);

// Dose management
router.get('/:medicationId/doses', medicationController.getTodayDoses);
router.post('/:medicationId/doses/generate', medicationController.generateDoses);
router.put('/doses/:doseId', medicationController.updateDoseStatus);
router.get('/history/:period', medicationController.getDoseHistory); // day, week, month

// Upcoming doses
router.get('/upcoming/today', medicationController.getTodayDoses);
router.get('/upcoming/week', medicationController.getWeekDoses);

module.exports = router;