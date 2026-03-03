import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getConversations,
  createConversation,
  getConversationById,
  getMessages,
  markAsRead,
  searchUsers,
  getUnreadCount,
  getOnlineUsers
} from '../controllers/chat/chatController.js';

const router = express.Router();

// All chat routes require authentication
router.use(protect);

// Conversation routes
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversationById);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/read', markAsRead);

// User search route
router.get('/users/search', searchUsers);

// Unread count route
router.get('/unread-count', getUnreadCount);

// Online users route
router.get('/online-users', getOnlineUsers);

export default router;
