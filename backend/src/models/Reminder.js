const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dose'
  },
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication'
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['reminder', 'missed', 'test', 'refill', 'followup'],
    required: true
  },
  notifications: [{
    type: {
      type: String,
      enum: ['email', 'push', 'sms']
    },
    success: Boolean,
    error: String,
    sentAt: Date
  }],
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'read'],
    default: 'sent'
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
reminderSchema.index({ userId: 1, scheduledAt: -1 });
reminderSchema.index({ doseId: 1 });
reminderSchema.index({ status: 1 });

const Reminder = mongoose.model('Reminder', reminderSchema);

module.exports = Reminder;