import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  attendance: { type: Number, default: 0, min: 0, max: 10 },
  midterm: { type: Number, default: 0, min: 0, max: 10 },
  finalExam: { type: Number, default: 0, min: 0, max: 10 },
  totalScore: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  lockedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Auto calculate totalScore: 10% attendance + 30% midterm + 60% finalExam
scoreSchema.pre('save', function(next) {
  this.totalScore = Math.round(
    (this.attendance * 0.1 + this.midterm * 0.3 + this.finalExam * 0.6) * 10
  ) / 10;
  next();
});

scoreSchema.index({ studentId: 1, subjectId: 1, semesterId: 1 }, { unique: true });

export default mongoose.model('Score', scoreSchema);
