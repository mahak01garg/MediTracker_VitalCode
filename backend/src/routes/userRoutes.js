const express = require('express');
const router = express.Router();
//const authController = require('../controllers/authController');
const { auth, firebaseAuth } = require('../middleware/auth');

//const { auth } = require("../middleware/auth");

const authController = require('../controllers/authController');
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password",  authController.resetPassword);
//router.put("/notification-preferences", authController.updateNotificationPreferences);
//router.delete("/delete-account", auth, authController.deleteAccount);
router.post("/resend-otp", authController.resendOtp);
module.exports=router;