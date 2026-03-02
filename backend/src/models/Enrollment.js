import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'on_leave'],
    default: 'active'
  },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancelReason: { type: String }
}, { timestamps: true });

// Indexes for performance
enrollmentSchema.index({ classId: 1, studentId: 1 }, { unique: true });
enrollmentSchema.index({ studentId: 1 }); // For student's classes
enrollmentSchema.index({ classId: 1 }); // For class's students
enrollmentSchema.index({ studentId: 1, status: 1 }); // For querying student enrollments by status

export default mongoose.model('Enrollment', enrollmentSchema);
