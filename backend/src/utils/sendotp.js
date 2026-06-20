const emailService = require('../services/notification/EmailService');
const logger = require('./logger');

const sendOtp = async (email, otp, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const subject = 'Your OTP for Email Verification';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Your OTP is: <strong style="font-size: 24px; color: #007bff;">${otp}</strong></p>
          <p>This OTP is valid for 5 minutes.</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `;
      
      const result = await emailService.sendEmail(email, subject, html);
      
      if (result.success) {
        logger.info(`OTP sent successfully to ${email}`);
        return { success: true, messageId: result.messageId };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error(`OTP send attempt ${attempt}/${retries} failed:`, error.message);
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delayMs = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delayMs));
      } else {
        logger.error(`Failed to send OTP to ${email} after ${retries} attempts:`, error);
        return { success: false, error: error.message };
      }
    }
  }
};

module.exports = { sendOtp };
