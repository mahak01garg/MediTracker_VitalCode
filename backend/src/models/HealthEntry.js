const mongoose = require('mongoose');

const healthEntrySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    bloodPressure: {
        systolic: Number,
        diastolic: Number
    },
    bloodSugar: Number, // mg/dL
    weight: Number, // kg
    temperature: Number, // °C
    heartRate: Number, // bpm
    notes: String,
    medicationTaken: Boolean,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthEntry', healthEntrySchema);