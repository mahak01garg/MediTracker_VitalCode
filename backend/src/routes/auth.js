const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, firebaseAuth } = require('../middleware/auth');
const { upload } = require('../middleware/multer.middleware');


// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google',firebaseAuth, authController.googleAuth);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, upload.single('profilePicture'), authController.updateProfile);
//router.put('/notification-preferences', auth, authController.updateNotificationPreferences);
//router.post('/connect-google-calendar', auth, authController.connectGoogleCalendar);
//router.delete('/account', auth, authController.deleteAccount);

module.exports = router;
