import mongoose from 'mongoose';

const violationReportSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000
  },
  evidence: [{
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'converted_to_expulsion', 'dismissed'],
    default: 'pending',
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNote: {
    type: String,
    maxlength: 1000
  },
  expulsionRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpulsionRecord'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound indexes
violationReportSchema.index({ studentId: 1, status: 1 });
violationReportSchema.index({ reportedBy: 1, createdAt: -1 });
violationReportSchema.index({ status: 1, createdAt: -1 });

const ViolationReport = mongoose.model('ViolationReport', violationReportSchema);

export default ViolationReport;
