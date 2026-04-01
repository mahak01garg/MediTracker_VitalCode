const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { 
    type: String,
    required: function() { return !this.isGoogleAuth } // required only for normal signup
  },
  otp: String,
otpExpiry: Date,
resetOtp: String,
resetOtpExpiry: Date,


  firebaseUid: { type: String, unique: true, sparse: true }, // Firebase UID from Google login
  isGoogleAuth: { type: Boolean, default: false },          // Marks if user used Google login
  name: { type: String, required: true },
  phone: { type: String },
  birthDate: { type: Date },
  address: { type: String },
  profilePicture: { type: String },

  emergencyContact: {
    name: String,
    phone: String,
    email: String,
    relationship: String
  },

  // notificationPreferences: {
  //   email: { type: Boolean, default: true },
  //   sms: { type: Boolean, default: false },
  //   push: { type: Boolean, default: true },
  //   reminderTime: { type: Number, default: 5 } // minutes before
  // },
  notificationPreferences: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true }
},


  googleCalendar: {
    enabled: { type: Boolean, default: false },
    calendarId: String,
    accessToken: String,
    refreshToken: String
  },

  rewardPoints: { type: Number, default: 0 },

  badges: [{
    name: String,
    title: String,
    description: String,
    icon: String,
    awardedAt: Date
  }],

  streaks: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastDoseTaken: Date
  },

  fcmTokens: {
    type: [String],
    default: []
  }

}, { timestamps: true }

); // automatically adds createdAt and updatedAt

module.exports = mongoose.model('User', userSchema);
