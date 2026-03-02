import mongoose from 'mongoose';

const gradebookSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  qt: { type: Number, default: 0 },
  gk: { type: Number, default: 0 },
  ck: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  // Điểm trung bình các bài tập (trắc nghiệm) của môn/lớp này
  averageScore: { type: Number, default: 0 },
  dismissedMarker: {
    isDismissed: { type: Boolean, default: false },
    dismissedAt: Date,
    expulsionRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpulsionRecord'
    }
  },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

gradebookSchema.pre('save', function (next) {
  this.total = Math.round((this.qt * 0.3 + this.gk * 0.2 + this.ck * 0.5) * 10) / 10;
  next();
});

// Indexes for pagination performance
gradebookSchema.index({ classId: 1, studentId: 1 }, { unique: true });
gradebookSchema.index({ classId: 1 });
gradebookSchema.index({ isDeleted: 1 });
gradebookSchema.index({ classId: 1, isDeleted: 1 }); // Compound index for fetching class gradebook

export default mongoose.model('Gradebook', gradebookSchema);
