// doctorRoutes.js
const { Router } = require('express');
const { 
  registerDoctor, 
  loginDoctor, 
  verifyOtp, 
  verifyEmail, 
  logoutDoctor, 
  refreshAccessToken,
  getCurrentDoctor,
  updateDoctor,
  getAllDoctors,
  getDoctorById
} = require('../controllers/doctor.controllers.js');
const { getDoctorAppointments } = require('../controllers/slotRequest.controllers.js');
const { upload } = require('../middleware/multer.middleware.js');
const { isDoctorAuthenticated } = require('../middleware/auth.middleware.js');

const router = Router();

// Authentication routes
router.post('/register', upload.single('avatar'), registerDoctor);
router.post('/login', loginDoctor);
router.post('/verify-otp', verifyOtp);
router.post('/verify-email', verifyEmail);
router.post('/logout', isDoctorAuthenticated, logoutDoctor);
router.post('/refresh-token', refreshAccessToken);
router.get('/me', isDoctorAuthenticated, getCurrentDoctor);
router.get('/me/bookings', isDoctorAuthenticated, getDoctorAppointments);
router.patch('/update', isDoctorAuthenticated, upload.single('avatar'), updateDoctor);
router.route("/").get(getAllDoctors);          
router.route("/:id").get(getDoctorById);        

module.exports = router;
