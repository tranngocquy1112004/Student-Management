import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true }, // Link to schedule
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // Format: "HH:MM" (copied from schedule)
  endTime: { type: String, required: true }, // Format: "HH:MM" (copied from schedule)
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes for pagination performance
attendanceSessionSchema.index({ classId: 1 });
attendanceSessionSchema.index({ isDeleted: 1 });
attendanceSessionSchema.index({ scheduleId: 1 }); // For schedule-to-session lookup
attendanceSessionSchema.index({ classId: 1, isDeleted: 1 }); // Compound index for fetching class sessions
attendanceSessionSchema.index({ classId: 1, date: 1, isDeleted: 1 }); // For finding sessions by class and date
attendanceSessionSchema.index({ date: -1 }); // For date-based sorting

export default mongoose.model('AttendanceSession', attendanceSessionSchema);
