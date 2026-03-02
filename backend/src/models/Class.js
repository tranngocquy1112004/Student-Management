import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: String, required: true },
  year: { type: String, required: true },
  status: { type: String, enum: ['active', 'closed', 'upcoming'], default: 'active' },
  maxStudents: { type: Number, default: 50 },
  totalLessons: { 
    type: Number, 
    required: false,
    min: 0 
  },
  scheduledLessons: { 
    type: Number, 
    default: 0,
    min: 0,
    validate: {
      validator: function(value) {
        return !this.totalLessons || value <= this.totalLessons;
      },
      message: 'scheduledLessons cannot exceed totalLessons'
    }
  },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes for performance
classSchema.index({ teacherId: 1 });
classSchema.index({ subjectId: 1 });
classSchema.index({ isDeleted: 1 });
classSchema.index({ teacherId: 1, isDeleted: 1 }); // Compound index for teacher's classes

export default mongoose.model('Class', classSchema);
