const mongoose = require('mongoose');

const sideEffectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  sideEffects: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 1
    },
    notes: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'chronic'],
      default: 'active'
    }
  }],
  reportedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  severityLevel: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    default: 'mild'
  },
  impactOnDailyLife: {
    type: String,
    enum: ['none', 'minimal', 'moderate', 'severe'],
    default: 'none'
  },
  reportedToDoctor: {
    type: Boolean,
    default: false
  },
  doctorNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
sideEffectSchema.index({ userId: 1, reportedAt: -1 });
sideEffectSchema.index({ medicationId: 1 });
sideEffectSchema.index({ 'sideEffects.name': 1 });

// Calculate severity level before saving
sideEffectSchema.pre('save', function(next) {
  if (this.sideEffects && this.sideEffects.length > 0) {
    const avgSeverity = this.sideEffects.reduce((sum, se) => sum + se.severity, 0) / this.sideEffects.length;
    
    if (avgSeverity <= 3) {
      this.severityLevel = 'mild';
    } else if (avgSeverity <= 7) {
      this.severityLevel = 'moderate';
    } else {
      this.severityLevel = 'severe';
    }
  }
  next();
});

const SideEffect = mongoose.model('SideEffect', sideEffectSchema);

module.exports = SideEffect;