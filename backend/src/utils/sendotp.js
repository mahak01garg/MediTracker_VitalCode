const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD || process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

const sendOtp = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: emailUser,
      to: email,
      subject: "Your OTP for Email Verification",
      html: `<p>Your OTP is: <strong>${otp}</strong></p><p>This OTP is valid for 5 minutes.</p>`,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP:', error);
    return false;
  }
};

module.exports = { sendOtp };
