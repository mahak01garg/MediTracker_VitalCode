const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  points: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, 
    enum: [
      'dose_taken', 
      'streak', 
      'medication_completed', 
      'bonus',
      'redemption',
      'badge_earned'
    ],
    required: true 
  },
  description: String,
  redeemed: { 
    type: Boolean, 
    default: false 
  },
  redeemedAt: Date,
  partnerOffer: {
    partnerId: String,
    partnerName: String,
    discountCode: String,
    discountAmount: Number
  },
  metadata: {
    doseId: mongoose.Schema.Types.ObjectId,
    medicationId: mongoose.Schema.Types.ObjectId,
    healthEntryId: mongoose.Schema.Types.ObjectId,
    badgeId: String,
    badgePoints: Number,
    takenAt: Date,
    entryType: String,
    medicationName: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Reward', rewardSchema);