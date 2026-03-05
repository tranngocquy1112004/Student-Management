import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: Date, required: true }, // Specific date for attendance session
  startTime: { type: String, required: true }, // Format: "HH:MM"
  endTime: { type: String, required: true }, // Format: "HH:MM"
  room: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes for performance
scheduleSchema.index({ classId: 1 });
scheduleSchema.index({ isDeleted: 1 });
scheduleSchema.index({ classId: 1, isDeleted: 1 }); // Compound index for fetching class schedules
scheduleSchema.index({ date: 1 }); // For date-based queries
scheduleSchema.index({ classId: 1, date: 1, isDeleted: 1 }); // Compound index for efficient lookups

export default mongoose.model('Schedule', scheduleSchema);
