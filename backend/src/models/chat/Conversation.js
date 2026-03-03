import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    unreadCount: {
      type: Number,
      default: 0,
      min: [0, 'Unread count cannot be negative']
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastMessage: {
    content: {
      type: String,
      trim: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Validation: Must have exactly 2 participants
conversationSchema.path('participants').validate(function(participants) {
  return participants && participants.length === 2;
}, 'Conversation must have exactly 2 participants');

// Validation: Participants must be unique
conversationSchema.path('participants').validate(function(participants) {
  if (!participants || participants.length !== 2) return true;
  return participants[0].userId.toString() !== participants[1].userId.toString();
}, 'Participants must be unique users');

// Indexes for performance
// Compound index for finding conversations by user and sorting by update time
conversationSchema.index({ 'participants.userId': 1, updatedAt: -1 });

// Index for sorting conversations by update time
conversationSchema.index({ updatedAt: -1 });

// Index for finding conversations by participant
conversationSchema.index({ 'participants.userId': 1 });

// Instance method to get the other participant
conversationSchema.methods.getOtherParticipant = function(userId) {
  return this.participants.find(p => p.userId.toString() !== userId.toString());
};

// Instance method to get participant by userId
conversationSchema.methods.getParticipant = function(userId) {
  return this.participants.find(p => p.userId.toString() === userId.toString());
};

// Static method to find conversation between two users
conversationSchema.statics.findBetweenUsers = async function(userId1, userId2) {
  return this.findOne({
    'participants.userId': { $all: [userId1, userId2] }
  });
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
