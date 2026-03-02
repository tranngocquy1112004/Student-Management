import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  isLocked: { type: Boolean, default: false },
  studentCode: { type: String },
  teacherCode: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  status: {
    type: String,
    enum: ['active', 'on_leave', 'dismissed', 'suspended'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ studentCode: 1 });
userSchema.index({ teacherCode: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ role: 1, isDeleted: 1 }); // Compound index for common queries
userSchema.index({ status: 1 }); // Index for status field
userSchema.index({ role: 1, status: 1 }); // Compound index for role and status queries

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
