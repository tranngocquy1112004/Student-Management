import mongoose from 'mongoose';

const expulsionRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000
  },
  reasonType: {
    type: String,
    enum: ['low_gpa', 'discipline_violation', 'excessive_absence', 'expired_leave'],
    required: true,
    index: true
  },
  effectiveDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        // Allow past dates for historical records, but validate on creation
        return true;
      },
      message: 'effectiveDate must be a valid date'
    }
  },
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'appealed', 'revoked'],
    default: 'active',
    index: true
  },
  appealStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
    index: true
  },
  appealReason: {
    type: String,
    maxlength: 2000
  },
  appealEvidence: [{
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  appealSubmittedAt: Date,
  appealReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  appealReviewedAt: Date,
  appealReviewNote: {
    type: String,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailSentAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound indexes for common queries
expulsionRecordSchema.index({ studentId: 1, status: 1 });
expulsionRecordSchema.index({ status: 1, createdAt: -1 });
expulsionRecordSchema.index({ reasonType: 1, effectiveDate: 1 });
expulsionRecordSchema.index({ appealStatus: 1, appealSubmittedAt: -1 });

// Pre-save validation for effectiveDate (only for new records)
expulsionRecordSchema.pre('save', function(next) {
  if (this.isNew) {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    const effectiveDate = new Date(this.effectiveDate);
    effectiveDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
    
    if (effectiveDate < now) {
      return next(new Error('effectiveDate cannot be in the past'));
    }
  }
  next();
});

const ExpulsionRecord = mongoose.model('ExpulsionRecord', expulsionRecordSchema);

export default ExpulsionRecord;
