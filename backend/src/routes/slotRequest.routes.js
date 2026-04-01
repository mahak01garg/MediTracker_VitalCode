const express = require('express');
const {
  requestSlot,
  createPaymentOrder,
  verifyPaymentAndConfirm,
  updateSlotRequestStatus,
  getMyAppointments,
  deleteAppointment
} = require('../controllers/slotRequest.controllers.js');
const { isAuthenticated, isDoctorAuthenticated, isClientAuthenticated } = require('../middleware/auth.middleware.js');

const router = express.Router();

// Get user's appointments
router.get('/my-appointments', isAuthenticated, getMyAppointments);

// Patient requests a slot
router.post('/request', isClientAuthenticated, requestSlot);
router.post('/create-payment-order', isClientAuthenticated, createPaymentOrder);
router.post('/verify-payment', isClientAuthenticated, verifyPaymentAndConfirm);

// Doctor accepts/rejects slot
router.put('/:requestId/status', isDoctorAuthenticated, updateSlotRequestStatus);

// Client/Doctor can delete their own appointment
router.delete('/:requestId', isAuthenticated, deleteAppointment);

module.exports = router;
