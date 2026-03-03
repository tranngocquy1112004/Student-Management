import ChatService from '../services/chat/ChatService.js';
import User from '../models/User.js';
import { getSocketService } from '../socketService.js';
import cacheService from '../services/cache/CacheService.js';

// In-memory store for typing indicators (short-lived)
// Performance: In-memory cache for typing indicators (Requirement 12.1, 12.2)
const typingUsers = new Map(); // conversationId -> Set of userIds

// Cache keys
const ONLINE_USERS_KEY = 'chat:online_users';

/**
 * Initialize chat socket handlers
 * @param {Socket} socket - Socket.io socket instance
 * @param {Server} io - Socket.io server instance
 */
export const initChatSocketHandlers = async (socket, io) => {
  const userId = socket.userId;
  
  // Performance: Cache online user status (Requirement 12.1, 12.2)
  // Add user to online users cache
  cacheService.sadd(ONLINE_USERS_KEY, userId);
  
  // Emit user online status
  io.emit('user:online', { userId });
  
  // Auto-join all user's conversations on connect
  try {
    const userConversations = await ChatService.getConversations(userId, 1, 100);
    userConversations.conversations.forEach(conversation => {
      socket.join(`conversation:${conversation._id}`);
      console.log(`👥 Auto-joined user ${userId} to conversation: ${conversation._id}`);
    });
  } catch (error) {
    console.error('Error auto-joining conversations:', error);
  }
  
  /**
   * Join a conversation room
   */
  socket.on('conversation:join', ({ conversationId }) => {
    console.log(`👥 User ${userId} joining conversation: ${conversationId}`);
    socket.join(`conversation:${conversationId}`);
  });

  /**
   * Leave a conversation room
   */
  socket.on('conversation:leave', ({ conversationId }) => {
    console.log(`👋 User ${userId} leaving conversation: ${conversationId}`);
    socket.leave(`conversation:${conversationId}`);
  });

  /**
   * Send a message
   */
  socket.on('message:send', async ({ conversationId, content }) => {
    try {
      console.log(`💬 Message send from user ${userId} in conversation ${conversationId}`);
      
      // Send message via service
      const message = await ChatService.sendMessage(conversationId, userId, content);
      
      // Emit confirmation to sender
      socket.emit('message:sent', {
        conversationId,
        message
      });
      
      // Broadcast to other participant in the conversation room
      socket.to(`conversation:${conversationId}`).emit('message:receive', {
        conversationId,
        message
      });
      
      // Emit conversation updated event to both participants
      io.to(`conversation:${conversationId}`).emit('conversation:updated', {
        conversationId
      });
      
      // Send notification to other participant (non-blocking)
      // Wrap in separate try-catch to not affect message sending
      (async () => {
        try {
          const conversation = await ChatService.getConversationById(conversationId, userId);
          const otherParticipant = conversation.participants.find(
            p => p.userId._id.toString() !== userId
          );
          
          if (otherParticipant) {
            const socketService = getSocketService();
            const user = await User.findById(userId).select('name');
            
            // Send notification
            await socketService.sendNotification(
              otherParticipant.userId._id,
              `New message from ${user.name}`,
              content.length > 50 ? content.substring(0, 50) + '...' : content,
              'chat',
              conversationId,
              'conversation'
            );
          }
        } catch (notifError) {
          console.error('Error sending notification (non-critical):', notifError.message);
        }
      })();
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', {
        code: 'MESSAGE_SEND_FAILED',
        message: error.message || 'Failed to send message'
      });
    }
  });

  /**
   * Typing indicator start
   */
  socket.on('typing:start', async ({ conversationId }) => {
    try {
      console.log(`⌨️  User ${userId} started typing in conversation ${conversationId}`);
      
      // Add to typing users
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }
      typingUsers.get(conversationId).add(userId);
      
      // Get user info
      const user = await User.findById(userId).select('name');
      
      // Broadcast to other participants (not to sender)
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId,
        userName: user.name
      });
      
      // Auto-stop typing after 3 seconds
      setTimeout(() => {
        if (typingUsers.has(conversationId)) {
          typingUsers.get(conversationId).delete(userId);
          if (typingUsers.get(conversationId).size === 0) {
            typingUsers.delete(conversationId);
          }
        }
        
        socket.to(`conversation:${conversationId}`).emit('typing:stop', {
          conversationId,
          userId
        });
      }, 3000);
      
    } catch (error) {
      console.error('Error handling typing start:', error);
    }
  });

  /**
   * Typing indicator stop
   */
  socket.on('typing:stop', ({ conversationId }) => {
    console.log(`⌨️  User ${userId} stopped typing in conversation ${conversationId}`);
    
    // Remove from typing users
    if (typingUsers.has(conversationId)) {
      typingUsers.get(conversationId).delete(userId);
      if (typingUsers.get(conversationId).size === 0) {
        typingUsers.delete(conversationId);
      }
    }
    
    // Broadcast to other participants
    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
      conversationId,
      userId
    });
  });

  /**
   * Handle disconnect
   */
  socket.on('disconnect', () => {
    console.log(`❌ User ${userId} disconnected from chat`);
    
    // Performance: Remove user from online users cache (Requirement 12.1, 12.2)
    cacheService.srem(ONLINE_USERS_KEY, userId);
    
    // Emit user offline status
    io.emit('user:offline', { userId });
    
    // Clean up typing indicators
    typingUsers.forEach((users, conversationId) => {
      if (users.has(userId)) {
        users.delete(userId);
        if (users.size === 0) {
          typingUsers.delete(conversationId);
        }
        
        // Notify others that user stopped typing
        io.to(`conversation:${conversationId}`).emit('typing:stop', {
          conversationId,
          userId
        });
      }
    });
  });
};

/**
 * Get typing users for a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Array} - Array of user IDs currently typing
 */
export const getTypingUsers = (conversationId) => {
  return typingUsers.has(conversationId) 
    ? Array.from(typingUsers.get(conversationId))
    : [];
};

/**
 * Get online users
 * Performance: Uses cache (Requirement 12.1, 12.2)
 * @returns {Promise<Array>} - Array of online user IDs
 */
export const getOnlineUsers = async () => {
  return await cacheService.smembers(ONLINE_USERS_KEY);
};

/**
 * Check if user is online
 * Performance: Uses cache (Requirement 12.1, 12.2)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const isUserOnline = async (userId) => {
  return await cacheService.sismember(ONLINE_USERS_KEY, userId);
};
