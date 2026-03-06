import { useCallback, useMemo } from 'react';
import { useChat as useChatContext } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

export const useMessages = (conversationId) => {
  const context = useChatContext();
  const { user } = useAuth();
  
  const {
    messages,
    messagePagination,
    setMessages,
    currentConversation,
  } = context;

  // Get messages for current conversation
  const conversationMessages = useMemo(() => {
    if (!conversationId) return [];
    return messages[conversationId] || [];
  }, [messages, conversationId]);

  // Get pagination info for current conversation
  const pagination = useMemo(() => {
    if (!conversationId) return { page: 1, hasMore: false };
    return messagePagination[conversationId] || { page: 1, hasMore: false };
  }, [messagePagination, conversationId]);

  // Handle new message received from socket (will be used in Task 11)
  const handleMessageReceive = useCallback((message) => {
    if (!message.conversationId) return;
    
    setMessages(prev => {
      const convMessages = prev[message.conversationId] || [];
      
      // Check if message already exists (avoid duplicates)
      const exists = convMessages.find(m => m._id === message._id);
      if (exists) return prev;
      
      return {
        ...prev,
        [message.conversationId]: [...convMessages, message]
      };
    });
  }, [setMessages]);

  // Handle message sent confirmation from socket (will be used in Task 11)
  const handleMessageSent = useCallback((message) => {
    if (!message.conversationId) return;
    
    setMessages(prev => {
      const convMessages = prev[message.conversationId] || [];
      
      // Replace temp message with confirmed message
      return {
        ...prev,
        [message.conversationId]: convMessages.map(m =>
          m.pending && m.content === message.content ? message : m
        )
      };
    });
  }, [setMessages]);

  // Group messages by date
  const groupMessagesByDate = useCallback((msgs) => {
    const groups = {};
    
    msgs.forEach(message => {
      const date = new Date(message.timestamp);
      const dateKey = date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(message);
    });
    
    return groups;
  }, []);

  // Get grouped messages
  const groupedMessages = useMemo(() => {
    return groupMessagesByDate(conversationMessages);
  }, [conversationMessages, groupMessagesByDate]);

  // Check if message is from current user
  const isOwnMessage = useCallback((message) => {
    if (!user || !message) {
      return false;
    }
    
    // If message is pending, it's always from current user
    if (message.pending === true) {
      return true;
    }
    
    // Extract sender ID - handle both object and string formats
    let senderId;
    if (typeof message.senderId === 'object' && message.senderId !== null) {
      senderId = message.senderId._id || message.senderId.id;
    } else if (typeof message.senderId === 'string') {
      senderId = message.senderId;
    } else {
      return false;
    }
    
    // Extract user ID
    const userId = user._id || user.id;
    
    if (!senderId || !userId) {
      return false;
    }
    
    // Ensure both IDs are strings and trim whitespace
    const senderIdStr = String(senderId).trim();
    const userIdStr = String(userId).trim();
    
    const isOwn = senderIdStr === userIdStr;
    
    // Debug log for troubleshooting
    return isOwn;
  }, [user]);

  // Check if should show sender info (for consecutive messages from same sender)
  const shouldShowSenderInfo = useCallback((message, index, msgs) => {
    if (index === 0) return true;
    
    const prevMessage = msgs[index - 1];
    const currentSenderId = message.senderId._id || message.senderId;
    const prevSenderId = prevMessage.senderId._id || prevMessage.senderId;
    
    // Show sender info if different sender or time gap > 5 minutes
    if (currentSenderId !== prevSenderId) return true;
    
    const timeDiff = new Date(message.timestamp) - new Date(prevMessage.timestamp);
    return timeDiff > 5 * 60 * 1000; // 5 minutes
  }, []);

  // Format message timestamp
  const formatMessageTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Get typing indicator for current conversation
  const getTypingIndicator = useCallback(() => {
    if (!conversationId || !context.typingUsers) return null;
    
    const typingInfo = context.typingUsers.get(conversationId);
    if (!typingInfo || !user) return null;
    
    // Don't show typing indicator for own typing
    if (typingInfo.userId === user._id) return null;
    
    return typingInfo;
  }, [conversationId, context.typingUsers, user]);

  // Check if there are more messages to load
  const hasMoreMessages = useMemo(() => {
    return pagination.hasMore;
  }, [pagination]);

  // Get last message in conversation
  const lastMessage = useMemo(() => {
    if (conversationMessages.length === 0) return null;
    return conversationMessages[conversationMessages.length - 1];
  }, [conversationMessages]);

  // Check if message is pending (not yet sent)
  const isPending = useCallback((message) => {
    return message.pending === true;
  }, []);

  return {
    messages: conversationMessages,
    groupedMessages,
    pagination,
    hasMoreMessages,
    lastMessage,
    handleMessageReceive,
    handleMessageSent,
    isOwnMessage,
    shouldShowSenderInfo,
    formatMessageTime,
    getTypingIndicator,
    isPending,
  };
};
