import { Server } from 'socket.io';
import { setSocketService } from './socketService.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Notification from './models/Notification.js';
import { initChatSocketHandlers } from './socket/chatSocketHandler.js';

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user || user.isDeleted || user.isLocked) return next(new Error('Invalid user'));
      socket.userId = user._id.toString();
      socket.userRole = user.role; // Add user role for permission checks
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 User connected: ${socket.userId}, Socket ID: ${socket.id}`);
    socket.join(socket.userId);
    
    // Initialize chat socket handlers (async to auto-join conversations)
    await initChatSocketHandlers(socket, io);
    
    // Listen for notification read event
    socket.on('notification:read', () => {
      console.log(`✓ Notification read event from user: ${socket.userId}`);
      // Broadcast back to the same user to update unread count
      socket.emit('notification:read');
    });
    
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });
  });

  const emitToUser = (userId, event, data) => {
    console.log(`📤 Emitting '${event}' to user: ${userId}`, data);
    io.to(userId.toString()).emit(event, data);
  };

  const sendNotification = async (userId, title, content, type, refId, refType) => {
    await Notification.create({ userId, title, content, type, refId, refType });
    emitToUser(userId, 'notification', { title, content, type });
  };

  setSocketService({ emitToUser, sendNotification });
  return { io, emitToUser, sendNotification };
};
