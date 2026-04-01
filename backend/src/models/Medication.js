const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g., "500mg", "1 tablet"
    frequency: { 
        type: String, 
        enum: ['daily', 'twice_daily','weekly', 'monthly', 'custom'],
        required: true 
    },
    schedule: [{
        day: [String], // 'mon', 'tue', etc. or 'everyday'
        times: [String] // ['08:00', '20:00']
    }],
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    instructions: String,
    notes: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Medication', medicationSchema);