import { io } from 'socket.io-client';

// Socket.io client instance
let socket = null;

// Get socket URL from environment or default to localhost
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

/**
 * Initialize socket connection with JWT authentication
 * @param {string} token - JWT token from localStorage
 * @returns {Socket} - Socket.io client instance
 */
export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }

  console.log('Initializing socket connection...');

  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    reconnection: true,
    reconnectionDelay: 1000,        // Start with 1s delay
    reconnectionDelayMax: 5000,     // Max 5s delay
    reconnectionAttempts: 5,        // Try 5 times
    timeout: 10000                  // 10s timeout
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`🔄 Reconnection attempt ${attemptNumber}`);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Reconnected after ${attemptNumber} attempts`);
  });

  socket.on('reconnect_failed', () => {
    console.error('❌ Reconnection failed after max attempts');
  });

  return socket;
};

/**
 * Get current socket instance
 * @returns {Socket|null} - Socket.io client instance or null
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

/**
 * Check if socket is connected
 * @returns {boolean} - True if connected
 */
export const isSocketConnected = () => {
  return socket && socket.connected;
};

/**
 * Emit a socket event
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
export const emitSocketEvent = (event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
  } else {
    console.warn('Socket not connected, cannot emit event:', event);
  }
};

/**
 * Listen to a socket event
 * @param {string} event - Event name
 * @param {function} callback - Event handler
 */
export const onSocketEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Remove socket event listener
 * @param {string} event - Event name
 * @param {function} callback - Event handler (optional)
 */
export const offSocketEvent = (event, callback) => {
  if (socket) {
    if (callback) {
      socket.off(event, callback);
    } else {
      socket.off(event);
    }
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  isSocketConnected,
  emitSocketEvent,
  onSocketEvent,
  offSocketEvent
};
