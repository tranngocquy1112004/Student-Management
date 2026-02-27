import { Server } from 'socket.io';
import { setSocketService } from './socketService.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import Notification from './models/Notification.js';

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
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.userId);
    socket.on('disconnect', () => {});
  });

  const emitToUser = (userId, event, data) => {
    io.to(userId.toString()).emit(event, data);
  };

  const sendNotification = async (userId, title, content, type, refId, refType) => {
    await Notification.create({ userId, title, content, type, refId, refType });
    emitToUser(userId, 'notification', { title, content, type });
  };

  setSocketService({ emitToUser, sendNotification });
  return { io, emitToUser, sendNotification };
};
