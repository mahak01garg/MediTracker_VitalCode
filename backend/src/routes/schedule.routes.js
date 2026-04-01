const express = require('express');
const { createSchedule, getDoctorSchedule } = require('../controllers/schedule.controllers.js');
const { isDoctorAuthenticated } = require('../middleware/auth.middleware.js');

const router = express.Router();

// Doctor creates schedule
router.post('/create', isDoctorAuthenticated, createSchedule);

// Patient/Anyone fetches schedule for doctor/date
router.get('/', getDoctorSchedule);

module.exports = router;
