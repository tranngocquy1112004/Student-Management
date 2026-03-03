import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Conversation ID is required'],
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    minlength: [1, 'Message content cannot be empty'],
    maxlength: [1000, 'Message content cannot exceed 1000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    validate: {
      validator: function(value) {
        // Timestamp should not be in the future (with 1 minute tolerance for clock skew)
        return value <= new Date(Date.now() + 60000);
      },
      message: 'Timestamp cannot be in the future'
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Compound index for efficient message retrieval sorted by timestamp
messageSchema.index({ conversationId: 1, timestamp: -1 });

// Index for counting messages in a conversation
messageSchema.index({ conversationId: 1 });

// Static method to get messages with pagination
messageSchema.statics.getMessagesPaginated = async function(conversationId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({ conversationId })
    .sort({ timestamp: -1 }) // Most recent first
    .skip(skip)
    .limit(Math.min(limit, 50)) // Max 50 messages per request
    .populate('senderId', 'name email avatar')
    .lean();
  
  // Reverse to show oldest first in UI
  return messages.reverse();
};

// Static method to count messages in a conversation
messageSchema.statics.countByConversation = async function(conversationId) {
  return this.countDocuments({ conversationId });
};

// Pre-save hook to validate sender is participant of conversation
messageSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Conversation = mongoose.model('Conversation');
    const conversation = await Conversation.findById(this.conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    const isParticipant = conversation.participants.some(
      p => p.userId.toString() === this.senderId.toString()
    );
    
    if (!isParticipant) {
      throw new Error('Sender must be a participant of the conversation');
    }
  }
  next();
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
