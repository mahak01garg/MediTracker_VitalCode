const express = require('express');
const { getHospitalsWithAmbulances } = require('../controllers/ambulance.controllers.js');
const { isAuthenticated } = require('../middleware/auth.middleware.js');

const router = express.Router();

router.get('/hospitals', isAuthenticated, getHospitalsWithAmbulances);

module.exports = router;
