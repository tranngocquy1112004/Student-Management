import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date, required: true },
  maxScore: { type: Number, default: 10 },
  type: { type: String, enum: ['individual', 'group'], default: 'individual' },
  // file: nộp file/tự luận, quiz: trắc nghiệm tự chấm
  mode: { type: String, enum: ['file', 'quiz'], default: 'file' },
  durationMinutes: { type: Number, default: 60 },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  attachments: [{ url: String, name: String }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Assignment', assignmentSchema);
