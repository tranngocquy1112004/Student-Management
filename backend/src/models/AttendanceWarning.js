import mongoose from 'mongoose';

const attendanceWarningSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  absenceRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalSessions: {
    type: Number,
    required: true,
    min: 1
  },
  absentSessions: {
    type: Number,
    required: true,
    min: 0
  },
  warningLevel: {
    type: String,
    enum: ['warning', 'critical'],
    required: true,
    index: true
  },
  notifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

// Validation: absentSessions <= totalSessions
attendanceWarningSchema.pre('save', function(next) {
  if (this.absentSessions > this.totalSessions) {
    return next(new Error('absentSessions cannot exceed totalSessions'));
  }
  
  // Validate absenceRate calculation
  const calculatedRate = (this.absentSessions / this.totalSessions) * 100;
  if (Math.abs(calculatedRate - this.absenceRate) > 0.01) {
    return next(new Error('absenceRate must equal (absentSessions / totalSessions) * 100'));
  }
  
  next();
});

// Compound indexes
attendanceWarningSchema.index({ studentId: 1, classId: 1 });
attendanceWarningSchema.index({ warningLevel: 1, createdAt: -1 });
attendanceWarningSchema.index({ classId: 1, warningLevel: 1 });

const AttendanceWarning = mongoose.model('AttendanceWarning', attendanceWarningSchema);

export default AttendanceWarning;
