import mongoose from 'mongoose';

const academicWarningSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  warningType: {
    type: String,
    enum: ['low_gpa', 'probation'],
    required: true
  },
  warningLevel: {
    type: Number,
    enum: [1, 2, 3],
    required: true,
    index: true
  },
  gpa: {
    type: Number,
    required: true,
    min: 0.0,
    max: 10.0
  },
  threshold: {
    type: Number,
    required: true,
    min: 0.0,
    max: 10.0
  },
  semester: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

// Validation: gpa must be less than threshold
academicWarningSchema.pre('save', function(next) {
  if (this.gpa >= this.threshold) {
    return next(new Error('GPA must be less than threshold'));
  }
  next();
});

// Compound indexes
academicWarningSchema.index({ studentId: 1, semester: 1 });
academicWarningSchema.index({ warningLevel: 1, createdAt: -1 });
academicWarningSchema.index({ studentId: 1, warningLevel: 1, semester: 1 });

const AcademicWarning = mongoose.model('AcademicWarning', academicWarningSchema);

export default AcademicWarning;
