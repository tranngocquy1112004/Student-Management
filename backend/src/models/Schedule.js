import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  dayOfWeek: { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  isExam: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes for performance
scheduleSchema.index({ classId: 1 });
scheduleSchema.index({ isDeleted: 1 });
scheduleSchema.index({ classId: 1, isDeleted: 1 }); // Compound index for fetching class schedules
scheduleSchema.index({ startDate: 1 }); // For date-based queries

export default mongoose.model('Schedule', scheduleSchema);
