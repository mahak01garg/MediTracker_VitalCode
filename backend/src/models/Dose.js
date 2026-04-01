const mongoose = require('mongoose');

const doseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medication', required: true },
    scheduledTime: { type: Date, required: true },
    actualTime: Date,
    status: { 
        type: String, 
        enum: ['pending', 'taken', 'missed', 'snoozed'],
        default: 'pending'
    },
    reminderSent: { type: Boolean, default: false },
    missedAlertSent: { type: Boolean, default: false },
    notes: String,
    dosage: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Dose', doseSchema);