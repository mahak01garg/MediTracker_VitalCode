const express = require('express');
const router = express.Router();
const emailService = require('../services/notification/EmailService');

// Diagnostic route
router.get('/diagnostic', async (req, res) => {
  const result = await emailService.diagnostic();
  res.json(result);
});

// Send test email
router.post('/send-test', async (req, res) => {
  const { to } = req.body;

  if (!to) {
    return res.status(400).json({
      success: false,
      error: true,
      message: 'Recipient email is required'
    });
  }

  const response = await emailService.sendTestEmail(to, {
    medicationName: 'Paracetamol',
    scheduledTime: '10:00 PM'
  });

  res.status(response.success ? 200 : 502).json(response);
});

module.exports = router;
