import Conversation from '../../models/chat/Conversation.js';
import Message from '../../models/chat/Message.js';
import User from '../../models/User.js';
import PermissionService from './PermissionService.js';
import cacheService from '../cache/CacheService.js';

// Cache keys and TTL
const UNREAD_COUNT_KEY_PREFIX = 'chat:unread_count:';
const UNREAD_COUNT_TTL = 300; // 5 minutes

/**
 * ChatService handles all chat-related business logic
 */
class ChatService {
  /**
   * Create or get existing conversation between two users
   * @param {string} userId1 - ID of first user
   * @param {string} userId2 - ID of second user
   * @returns {Promise<Object>} - Conversation object
   */
  static async createOrGetConversation(userId1, userId2) {
    // Validate users exist
    const [user1, user2] = await Promise.all([
      User.findById(userId1),
      User.findById(userId2)
    ]);

    if (!user1 || !user2) {
      throw new Error('One or both users not found');
    }

    // Check permission
    const canChat = PermissionService.canChat(user1.role, user2.role);
    if (!canChat) {
      const errorMsg = PermissionService.getPermissionErrorMessage(user1.role, user2.role);
      throw new Error(errorMsg);
    }

    // Check if conversation already exists
    let conversation = await Conversation.findBetweenUsers(userId1, userId2);

    if (conversation) {
      // Populate participants
      await conversation.populate('participants.userId', 'name email role avatar');
      return conversation;
    }

    // Create new conversation
    conversation = new Conversation({
      participants: [
        { userId: userId1, unreadCount: 0, lastReadAt: new Date() },
        { userId: userId2, unreadCount: 0, lastReadAt: new Date() }
      ]
    });

    await conversation.save();
    await conversation.populate('participants.userId', 'name email role avatar');

    return conversation;
  }

  /**
   * Get conversations for a user with pagination
   * @param {string} userId - ID of user
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 20, max: 50)
   * @returns {Promise<Object>} - { conversations, pagination }
   */
  static async getConversations(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const actualLimit = Math.min(limit, 50); // Max 50 per page

    // Get conversations where user is participant
    // Performance: Use .lean() for read-only queries and projection (Requirement 12.3, 12.5)
    const [conversations, totalCount] = await Promise.all([
      Conversation.find({ 'participants.userId': userId })
        .select('participants lastMessage updatedAt') // Projection: only needed fields
        .populate('participants.userId', 'name email role avatar') // Projection in populate
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(actualLimit)
        .lean(), // Use lean() for better performance
      Conversation.countDocuments({ 'participants.userId': userId })
    ]);

    // Filter out conversations with self (both participants are the same user)
    const validConversations = conversations.filter(conv => {
      if (conv.participants.length !== 2) return true; // Keep if not 1-on-1
      
      const user1Id = conv.participants[0].userId._id.toString();
      const user2Id = conv.participants[1].userId._id.toString();
      
      // Filter out if both participants are the same user
      return user1Id !== user2Id;
    });

    return {
      conversations: validConversations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / actualLimit),
        totalItems: totalCount,
        itemsPerPage: actualLimit
      }
    };
  }

  /**
   * Get conversation by ID with access control
   * @param {string} conversationId - ID of conversation
   * @param {string} userId - ID of user requesting access
   * @returns {Promise<Object>} - Conversation object
   */
  static async getConversationById(conversationId, userId) {
    // Performance: Use .lean() and projection (Requirement 12.3, 12.5)
    const conversation = await Conversation.findById(conversationId)
      .select('participants lastMessage updatedAt createdAt') // Projection
      .populate('participants.userId', 'name email role avatar') // Projection in populate
      .lean(); // Use lean() for read-only query

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check access permission
    if (!PermissionService.canAccessConversation(userId, conversation)) {
      throw new Error('You do not have permission to access this conversation');
    }

    return conversation;
  }

  /**
   * Send a message in a conversation
   * @param {string} conversationId - ID of conversation
   * @param {string} senderId - ID of sender
   * @param {string} content - Message content
   * @returns {Promise<Object>} - Created message
   */
  static async sendMessage(conversationId, senderId, content) {
    // Validate content
    if (!content || !content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    if (content.length > 1000) {
      throw new Error('Message content cannot exceed 1000 characters');
    }

    // Get conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check permission
    if (!PermissionService.canSendMessage(senderId, conversation)) {
      throw new Error('You do not have permission to send messages in this conversation');
    }

    // Create message
    const message = new Message({
      conversationId,
      senderId,
      content: content.trim(),
      timestamp: new Date()
    });

    await message.save();

    // Update conversation's lastMessage
    conversation.lastMessage = {
      content: content.trim(),
      senderId,
      timestamp: message.timestamp
    };

    // Increment unread count for other participant
    const otherParticipant = conversation.getOtherParticipant(senderId);
    if (otherParticipant) {
      otherParticipant.unreadCount += 1;
      
      // Invalidate unread count cache for other participant
      const cacheKey = `${UNREAD_COUNT_KEY_PREFIX}${otherParticipant.userId}`;
      await cacheService.del(cacheKey);
    }

    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender info
    await message.populate('senderId', 'name email avatar');

    return message;
  }

  /**
   * Get messages in a conversation with pagination
   * @param {string} conversationId - ID of conversation
   * @param {string} userId - ID of user requesting messages
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 50, max: 50)
   * @returns {Promise<Object>} - { messages, pagination }
   */
  static async getMessages(conversationId, userId, page = 1, limit = 50) {
    // Verify conversation exists and user has access
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (!PermissionService.canAccessConversation(userId, conversation)) {
      throw new Error('You do not have permission to access this conversation');
    }

    const actualLimit = Math.min(limit, 50); // Max 50 per page
    const skip = (page - 1) * actualLimit;

    // Get messages
    // Performance: Use .lean() and projection (Requirement 12.3, 12.5)
    const [messages, totalCount] = await Promise.all([
      Message.find({ conversationId })
        .select('senderId content timestamp createdAt') // Projection: only needed fields
        .populate('senderId', 'name email avatar') // Projection in populate
        .sort({ timestamp: -1 }) // Most recent first
        .skip(skip)
        .limit(actualLimit)
        .lean(), // Use lean() for read-only query
      Message.countDocuments({ conversationId })
    ]);

    // Reverse to show oldest first
    messages.reverse();

    return {
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / actualLimit),
        totalItems: totalCount,
        itemsPerPage: actualLimit,
        hasMore: skip + messages.length < totalCount
      }
    };
  }

  /**
   * Mark conversation as read for a user
   * Performance: Invalidates unread count cache (Requirement 12.1, 12.2)
   * @param {string} conversationId - ID of conversation
   * @param {string} userId - ID of user
   * @returns {Promise<Object>} - Updated conversation
   */
  static async markAsRead(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check access permission
    if (!PermissionService.canAccessConversation(userId, conversation)) {
      throw new Error('You do not have permission to access this conversation');
    }

    // Reset unread count for this user
    const participant = conversation.getParticipant(userId);
    if (participant) {
      participant.unreadCount = 0;
      participant.lastReadAt = new Date();
      await conversation.save();
      
      // Invalidate unread count cache
      const cacheKey = `${UNREAD_COUNT_KEY_PREFIX}${userId}`;
      await cacheService.del(cacheKey);
    }

    return conversation;
  }

  /**
   * Get total unread count for a user
   * Performance: Uses cache with 5-minute TTL (Requirement 12.1, 12.2)
   * @param {string} userId - ID of user
   * @returns {Promise<number>} - Total unread count
   */
  static async getUnreadCount(userId) {
    // Check cache first
    const cacheKey = `${UNREAD_COUNT_KEY_PREFIX}${userId}`;
    const cachedCount = await cacheService.get(cacheKey);
    
    if (cachedCount !== null) {
      return cachedCount;
    }

    // Performance: Use .lean() and projection (Requirement 12.3, 12.5)
    const conversations = await Conversation.find({
      'participants.userId': userId
    })
    .select('participants') // Projection: only participants field
    .lean(); // Use lean() for read-only query

    let totalUnread = 0;
    for (const conv of conversations) {
      const participant = conv.participants.find(
        p => p.userId.toString() === userId.toString()
      );
      if (participant) {
        totalUnread += participant.unreadCount || 0;
      }
    }

    // Cache the result with 5-minute TTL
    await cacheService.set(cacheKey, totalUnread, UNREAD_COUNT_TTL);

    return totalUnread;
  }

  /**
   * Increment unread count for a user in a conversation
   * @param {string} conversationId - ID of conversation
   * @param {string} userId - ID of user
   * @returns {Promise<void>}
   */
  static async incrementUnreadCount(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const participant = conversation.getParticipant(userId);
    if (participant) {
      participant.unreadCount += 1;
      await conversation.save();
    }
  }

  /**
   * Reset unread count for a user in a conversation
   * @param {string} conversationId - ID of conversation
   * @param {string} userId - ID of user
   * @returns {Promise<void>}
   */
  static async resetUnreadCount(conversationId, userId) {
    await this.markAsRead(conversationId, userId);
  }
}

export default ChatService;
