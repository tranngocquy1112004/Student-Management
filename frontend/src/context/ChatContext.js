import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { initializeSocket, disconnectSocket, getSocket } from '../services/socketService';
import notificationService from '../services/notificationService';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState({}); // { conversationId: [messages] }
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map()); // { conversationId: { userId, userName } }
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected', 'disconnected', 'reconnecting', 'error'

  // Pagination state
  const [messagePagination, setMessagePagination] = useState({}); // { conversationId: { page, hasMore } }
  
  // Notification permission state
  const [notificationPermission, setNotificationPermission] = useState(
    localStorage.getItem('notification_permission') || 'default'
  );

  // Normalize message structure to ensure consistent senderId format
  const normalizeMessage = useCallback((message) => {
    if (!message) return null;
    
    // Ensure senderId is always an object with _id
    let normalizedSenderId = message.senderId;
    
    if (typeof message.senderId === 'string') {
      // Convert string ID to object format
      normalizedSenderId = {
        _id: message.senderId,
        name: 'Unknown',
        avatar: null
      };
      console.warn('⚠️ Normalized string senderId to object:', message.senderId);
    } else if (typeof message.senderId === 'object' && message.senderId !== null) {
      // Ensure _id field exists
      if (!message.senderId._id && message.senderId.id) {
        normalizedSenderId = {
          ...message.senderId,
          _id: message.senderId.id
        };
      }
    } else {
      console.error('❌ Invalid senderId format:', message.senderId);
      return null;
    }
    
    return {
      ...message,
      senderId: normalizedSenderId
    };
  }, []);

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Initializing socket connection for user:', user._id);
        const socket = initializeSocket(token);
        
        // Set up connection status handlers
        socket.on('connect', async () => {
          console.log('Socket connected');
          setConnectionStatus('connected');
          setError(null);
          
          // Fetch initial online users when connected
          try {
            const api = (await import('../api/axios')).default;
            const response = await api.get('/chat/online-users');
            if (response.data.success) {
              const onlineUserIds = response.data.data.onlineUsers;
              console.log('📡 Initial online users:', onlineUserIds);
              setOnlineUsers(new Set(onlineUserIds));
            }
          } catch (error) {
            console.error('Failed to fetch initial online users:', error);
          }
        });
        
        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error.message);
          setConnectionStatus('error');
          setError('Lỗi kết nối. Đang thử kết nối lại...');
        });
        
        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setConnectionStatus('disconnected');
          
          if (reason === 'io server disconnect') {
            // Server disconnected, show message
            setError('Mất kết nối với máy chủ');
          }
        });
        
        socket.on('reconnect_attempt', (attemptNumber) => {
          console.log(`Socket reconnecting... (attempt ${attemptNumber})`);
          setConnectionStatus('reconnecting');
          setError(`Đang kết nối lại... (lần thử ${attemptNumber})`);
        });
        
        socket.on('reconnect', (attemptNumber) => {
          console.log(`Socket reconnected after ${attemptNumber} attempts`);
          setConnectionStatus('connected');
          setError(null);
          
          // Show success toast
          if (window.toast) {
            window.toast.success('Đã kết nối lại thành công');
          }
          
          // Sync unsent messages on reconnect
          syncUnsentMessages();
        });
        
        socket.on('reconnect_failed', () => {
          console.error('Socket reconnection failed after max attempts');
          setConnectionStatus('failed');
          setError('Không thể kết nối lại. Vui lòng tải lại trang.');
          
          // Show error toast
          if (window.toast) {
            window.toast.error('Không thể kết nối lại. Vui lòng tải lại trang.');
          }
        });
        
        // Set up chat event handlers
        setupSocketEventHandlers(socket);
      }
    } else {
      // Disconnect socket when user logs out
      disconnectSocket();
      setConnectionStatus('disconnected');
    }
    
    // Cleanup on unmount
    return () => {
      if (!user) {
        disconnectSocket();
      }
    };
  }, [user]);

  // Setup socket event handlers for chat events
  const setupSocketEventHandlers = useCallback((socket) => {
    // Handle incoming message
    socket.on('message:receive', ({ conversationId, message }) => {
      console.log('📨 Message received:', message);
      
      // Validate message structure
      if (!message || !message.content || !message.senderId) {
        console.error('❌ Invalid message received:', message);
        return;
      }
      
      // Normalize message structure
      const normalizedMessage = normalizeMessage(message);
      if (!normalizedMessage) {
        console.error('❌ Failed to normalize message:', message);
        return;
      }
      
      // Add message to messages state
      setMessages(prev => {
        const convMessages = prev[conversationId] || [];
        
        // Check if message already exists (avoid duplicates)
        const exists = convMessages.find(m => m._id === normalizedMessage._id);
        if (exists) return prev;
        
        return {
          ...prev,
          [conversationId]: [...convMessages, normalizedMessage]
        };
      });
      
      // Update conversation's last message and move to top
      setConversations(prev => {
        // Find the conversation
        const convIndex = prev.findIndex(c => c._id === conversationId);
        if (convIndex === -1) return prev;
        
        const conversation = prev[convIndex];
        
        // Update conversation with new last message
        const updatedConv = {
          ...conversation,
          lastMessage: {
            content: message.content,
            senderId: message.senderId._id || message.senderId,
            timestamp: message.timestamp
          },
          updatedAt: message.timestamp
        };
        
        // Only increment unread count if NOT viewing this conversation
        if (currentConversation?._id !== conversationId) {
          updatedConv.participants = conversation.participants.map(p =>
            p.userId._id === user._id
              ? { ...p, unreadCount: (p.unreadCount || 0) + 1 }
              : p
          );
          
          console.log('📊 Incremented unread count for conversation:', conversationId);
        } else {
          console.log('👁️ User is viewing this conversation, not incrementing unread count');
        }
        
        // Remove from current position and add to top
        const newConversations = [...prev];
        newConversations.splice(convIndex, 1);
        newConversations.unshift(updatedConv);
        
        return newConversations;
      });
      
      // Show browser notification if chat window is not focused
      if (!notificationService.isChatWindowFocused() && notificationService.isEnabled()) {
        // Get sender name
        const senderName = message.senderId?.name || 'Người dùng';
        
        // Show notification
        notificationService.showChatNotification(
          message,
          senderName,
          conversationId,
          (data) => {
            // Handle notification click - navigate to chat and select conversation
            console.log('Notification clicked:', data);
            
            // Navigate to chat page
            window.location.href = `/chat?conversation=${data.conversationId}`;
          }
        );
      }
    });
    
    // Handle message sent confirmation
    socket.on('message:sent', ({ conversationId, message }) => {
      console.log('✅ Message sent confirmation:', message);
      
      // Validate message structure
      if (!message || !message.content || !message.senderId) {
        console.error('❌ Invalid message sent confirmation:', message);
        return;
      }
      
      // Normalize message structure
      const normalizedMessage = normalizeMessage(message);
      if (!normalizedMessage) {
        console.error('❌ Failed to normalize message:', message);
        return;
      }
      
      // Replace temp/pending message with confirmed message
      setMessages(prev => {
        const convMessages = prev[conversationId] || [];
        
        // Find the FIRST pending message with matching content and replace it
        let replaced = false;
        const updatedMessages = convMessages.map(m => {
          // Match by content and pending status - only replace the first match
          if (!replaced && m.pending && m.content === normalizedMessage.content) {
            replaced = true;
            console.log('🔄 Replacing pending message:', m._id, 'with confirmed:', normalizedMessage._id);
            return normalizedMessage;
          }
          return m;
        });
        
        // If no pending message was replaced, add the new message
        // This handles the case where the message was already confirmed
        if (!replaced) {
          const exists = updatedMessages.find(m => m._id === normalizedMessage._id);
          if (!exists) {
            console.log('➕ Adding confirmed message (no pending found):', normalizedMessage._id);
            updatedMessages.push(normalizedMessage);
          }
        }
        
        return {
          ...prev,
          [conversationId]: updatedMessages
        };
      });
    });
    
    // Handle typing start
    socket.on('typing:start', ({ conversationId, userId, userName }) => {
      console.log(`⌨️  ${userName} is typing in conversation ${conversationId}`);
      
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(conversationId, { userId, userName });
        return newMap;
      });
    });
    
    // Handle typing stop
    socket.on('typing:stop', ({ conversationId }) => {
      console.log(`⌨️  Typing stopped in conversation ${conversationId}`);
      
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });
    });
    
    // Handle user online
    socket.on('user:online', ({ userId }) => {
      console.log(`🟢 User ${userId} is online`);
      
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(userId);
        return newSet;
      });
    });
    
    // Handle user offline
    socket.on('user:offline', ({ userId }) => {
      console.log(`⚫ User ${userId} is offline`);
      
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });
    
    // Handle conversation updated
    socket.on('conversation:updated', async ({ conversationId }) => {
      console.log(`🔄 Conversation ${conversationId} updated`);
      
      // Optionally refresh conversation data from API
      // For now, we rely on message:receive to update the conversation
    });
    
    // Handle socket errors
    socket.on('error', ({ code, message }) => {
      console.error('❌ Socket error:', code, message);
      setError(message || 'Đã xảy ra lỗi kết nối');
      
      // Show error toast
      if (window.toast) {
        window.toast.error(message || 'Đã xảy ra lỗi kết nối');
      }
    });
  }, [user, currentConversation, normalizeMessage]);

  // Sync unsent messages from localStorage
  const syncUnsentMessages = useCallback(() => {
    try {
      const unsentStr = localStorage.getItem('unsent_messages');
      if (!unsentStr) return;
      
      const unsentMessages = JSON.parse(unsentStr);
      console.log(`🔄 Syncing ${unsentMessages.length} unsent messages`);
      
      const socket = getSocket();
      if (!socket || !socket.connected) return;
      
      unsentMessages.forEach(msg => {
        socket.emit('message:send', {
          conversationId: msg.conversationId,
          content: msg.content
        });
      });
      
      // Clear unsent messages after syncing
      localStorage.removeItem('unsent_messages');
      
    } catch (error) {
      console.error('Error syncing unsent messages:', error);
    }
  }, []);

  // Helper function to get other participant in conversation
  const getOtherParticipant = useCallback((conversation) => {
    if (!conversation || !user) return null;
    return conversation.participants.find(p => p.userId._id !== user._id);
  }, [user]);

  // Calculate total unread count
  const calculateUnreadCount = useCallback((convs) => {
    if (!user) return 0;
    return convs.reduce((total, conv) => {
      const participant = conv.participants.find(p => p.userId._id === user._id);
      return total + (participant?.unreadCount || 0);
    }, 0);
  }, [user]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    const permission = await notificationService.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  // Update unread count when conversations change
  useEffect(() => {
    setUnreadCount(calculateUnreadCount(conversations));
  }, [conversations, calculateUnreadCount]);

  const value = {
    // State
    conversations,
    currentConversation,
    messages,
    onlineUsers,
    typingUsers,
    unreadCount,
    loading,
    error,
    messagePagination,
    connectionStatus,
    notificationPermission,
    
    // State setters (exposed for hooks)
    setConversations,
    setCurrentConversation,
    setMessages,
    setOnlineUsers,
    setTypingUsers,
    setUnreadCount,
    setLoading,
    setError,
    setMessagePagination,
    setConnectionStatus,
    
    // Helper functions
    getOtherParticipant,
    calculateUnreadCount,
    syncUnsentMessages,
    requestNotificationPermission,
    
    // Socket instance getter
    getSocket,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
