import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true },
  shift: { type: String },
  code: { type: String },
  codeExpiredAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes for pagination performance
attendanceSessionSchema.index({ classId: 1 });
attendanceSessionSchema.index({ isDeleted: 1 });
attendanceSessionSchema.index({ classId: 1, isDeleted: 1 }); // Compound index for fetching class sessions
attendanceSessionSchema.index({ date: -1 }); // For date-based sorting

export default mongoose.model('AttendanceSession', attendanceSessionSchema);
