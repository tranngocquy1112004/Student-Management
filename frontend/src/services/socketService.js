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
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 10000
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
