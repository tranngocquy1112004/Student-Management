import ChatService from '../../services/chat/ChatService.js';
import PermissionService from '../../services/chat/PermissionService.js';

/**
 * ChatController handles HTTP requests for chat functionality
 */

/**
 * GET /api/chat/conversations
 * Get list of conversations for current user
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await ChatService.getConversations(userId, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CONVERSATIONS_FAILED',
        message: error.message || 'Failed to get conversations'
      }
    });
  }
};

/**
 * POST /api/chat/conversations
 * Create new conversation with another user
 */
export const createConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VAL_PARTICIPANT_REQUIRED',
          message: 'Participant ID is required'
        }
      });
    }

    if (participantId === userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VAL_CANNOT_CHAT_SELF',
          message: 'Cannot create conversation with yourself'
        }
      });
    }

    const conversation = await ChatService.createOrGetConversation(userId, participantId);

    res.status(201).json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    
    // Check if it's a permission error
    if (error.message.includes('cannot chat') || error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERM_CHAT_DENIED',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_CONVERSATION_FAILED',
        message: error.message || 'Failed to create conversation'
      }
    });
  }
};

/**
 * GET /api/chat/conversations/:id
 * Get conversation details by ID
 */
export const getConversationById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const conversation = await ChatService.getConversationById(id, userId);

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    console.error('Error getting conversation:', error);

    if (error.message === 'Conversation not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VAL_CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        }
      });
    }

    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERM_CONVERSATION_ACCESS',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CONVERSATION_FAILED',
        message: error.message || 'Failed to get conversation'
      }
    });
  }
};

/**
 * GET /api/chat/conversations/:id/messages
 * Get messages in a conversation with pagination
 */
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const result = await ChatService.getMessages(id, userId, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting messages:', error);

    if (error.message === 'Conversation not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VAL_CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        }
      });
    }

    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERM_CONVERSATION_ACCESS',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'GET_MESSAGES_FAILED',
        message: error.message || 'Failed to get messages'
      }
    });
  }
};

/**
 * POST /api/chat/conversations/:id/read
 * Mark conversation as read
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await ChatService.markAsRead(id, userId);

    res.json({
      success: true,
      message: 'Conversation marked as read'
    });
  } catch (error) {
    console.error('Error marking as read:', error);

    if (error.message === 'Conversation not found') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VAL_CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        }
      });
    }

    if (error.message.includes('permission')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERM_CONVERSATION_ACCESS',
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'MARK_READ_FAILED',
        message: error.message || 'Failed to mark as read'
      }
    });
  }
};

/**
 * GET /api/chat/users/search
 * Search users to chat with
 */
export const searchUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 20;

    const users = await PermissionService.getAvailableUsers(userId, userRole, query, limit);

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_USERS_FAILED',
        message: error.message || 'Failed to search users'
      }
    });
  }
};

/**
 * GET /api/chat/unread-count
 * Get total unread message count for current user
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await ChatService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_UNREAD_COUNT_FAILED',
        message: error.message || 'Failed to get unread count'
      }
    });
  }
};

/**
 * GET /api/chat/online-users
 * Get list of currently online users
 */
export const getOnlineUsers = async (req, res) => {
  try {
    const { getOnlineUsers } = await import('../../socket/chatSocketHandler.js');
    const onlineUserIds = await getOnlineUsers();

    res.json({
      success: true,
      data: { onlineUsers: onlineUserIds }
    });
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ONLINE_USERS_FAILED',
        message: error.message || 'Failed to get online users'
      }
    });
  }
};
