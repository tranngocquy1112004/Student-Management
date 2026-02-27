import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Semester', semesterSchema);
