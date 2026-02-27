import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledAt: { type: Date, default: Date.now },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { timestamps: true });

enrollmentSchema.index({ classId: 1, studentId: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
