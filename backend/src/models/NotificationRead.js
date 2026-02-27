import mongoose from 'mongoose';

const notificationReadSchema = new mongoose.Schema({
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  readAt: { type: Date, default: Date.now },
}, { timestamps: true });

notificationReadSchema.index({ notificationId: 1, userId: 1 }, { unique: true });

export default mongoose.model('NotificationRead', notificationReadSchema);
