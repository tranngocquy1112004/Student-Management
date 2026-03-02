import mongoose from 'mongoose';

const academicLeaveSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    enum: ['voluntary', 'medical', 'military', 'financial', 'personal'],
    required: true
  },
  reasonText: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 1000
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNote: {
    type: String,
    maxlength: 500
  }
}, { timestamps: true });

// Compound indexes for query performance
academicLeaveSchema.index({ studentId: 1, status: 1 });
academicLeaveSchema.index({ status: 1, createdAt: 1 });

// Pre-save validation to ensure startDate < endDate
academicLeaveSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    const error = new Error('startDate must be before endDate');
    return next(error);
  }
  next();
});

export default mongoose.model('AcademicLeave', academicLeaveSchema);
