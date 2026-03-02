import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes for pagination performance
announcementSchema.index({ classId: 1 });
announcementSchema.index({ isDeleted: 1 });
announcementSchema.index({ classId: 1, isDeleted: 1 }); // Compound index for fetching class announcements
announcementSchema.index({ createdAt: -1 }); // For date-based sorting

export default mongoose.model('Announcement', announcementSchema);
