import { useCallback } from 'react';
import { useChat as useChatContext } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-toastify';

export const useChat = () => {
  const context = useChatContext();
  const { user } = useAuth();
  
  const {
    conversations,
    currentConversation,
    messages,
    messagePagination,
    setConversations,
    setCurrentConversation,
    setMessages,
    setMessagePagination,
    setLoading,
    setError,
    calculateUnreadCount,
  } = context;

  // Load conversations with pagination
  const loadConversations = useCallback(async (page = 1, limit = 20) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/chat/conversations', {
        params: { page, limit }
      });
      
      if (response.data.success) {
        const { conversations: convs } = response.data.data;
        
        // Filter out conversations with self (both participants are the same user)
        const validConversations = convs.filter(conv => {
          const participants = conv.participants;
          if (participants.length !== 2) return true; // Keep if not 1-on-1
          
          const user1Id = participants[0].userId._id;
          const user2Id = participants[1].userId._id;
          
          // Filter out if both participants are the same user
          return user1Id !== user2Id;
        });
        
        // Ensure lastMessage has valid content
        const sanitizedConversations = validConversations.map(conv => ({
          ...conv,
          lastMessage: conv.lastMessage && conv.lastMessage.content && conv.lastMessage.content.trim() !== ''
            ? conv.lastMessage
            : null
        }));
        
        if (page === 1) {
          setConversations(sanitizedConversations);
        } else {
          setConversations(prev => [...prev, ...sanitizedConversations]);
        }
      }
    } catch (err) {
//       console.error('Error loading conversations:', err);
      setError(err.response?.data?.error?.message || 'Failed to load conversations');
      toast.error('Không thể tải danh sách hội thoại');
    } finally {
      setLoading(false);
    }
  }, [user, setConversations, setLoading, setError]);

  // Select a conversation and load its messages
  const selectConversation = useCallback(async (conversationId) => {
    if (!conversationId) {
      setCurrentConversation(null);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Find conversation in local state
      const conversation = conversations.find(c => c._id === conversationId);
      
      // Join conversation room via socket
      const socket = context.getSocket();
      if (socket && socket.connected) {
        socket.emit('conversation:join', { conversationId });
      }
      
      // Load messages for this conversation FIRST
      const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { page: 1, limit: 50 }
      });
      
      if (response.data.success) {
        const { messages: msgs, pagination } = response.data.data;
        
        setMessages(prev => ({
          ...prev,
          [conversationId]: msgs
        }));
        
        setMessagePagination(prev => ({
          ...prev,
          [conversationId]: {
            page: pagination.currentPage,
            hasMore: pagination.hasMore
          }
        }));
      }
      
      // Set current conversation AFTER messages are loaded
      if (conversation) {
        setCurrentConversation(conversation);
      }
      
      // Mark conversation as read
      await markAsRead(conversationId);
      
    } catch (err) {
//       console.error('Error selecting conversation:', err);
      setError(err.response?.data?.error?.message || 'Failed to load conversation');
      toast.error('Không thể tải hội thoại');
    } finally {
      setLoading(false);
    }
  }, [conversations, context, setCurrentConversation, setMessages, setMessagePagination, setLoading, setError]);

  // Save unsent message to localStorage
  const saveUnsentMessage = useCallback((conversationId, content) => {
    try {
      const unsentStr = localStorage.getItem('unsent_messages');
      const unsent = unsentStr ? JSON.parse(unsentStr) : [];
      
      unsent.push({
        conversationId,
        content,
        timestamp: new Date().toISOString(),
        id: `unsent-${Date.now()}`
      });
      
      localStorage.setItem('unsent_messages', JSON.stringify(unsent));
//       console.log('💾 Saved unsent message to localStorage');
      
    } catch (error) {
//       console.error('Error saving unsent message:', error);
    }
  }, []);

  // Send a message via socket with retry logic
  const sendMessage = useCallback(async (content, retryCount = 0) => {
    if (!currentConversation || !content.trim()) return;
    
    const MAX_RETRIES = 3;
    
    try {
      setError(null);
      
      const socket = context.getSocket();
      
      // Check if socket is connected
      if (!socket || !socket.connected) {
        // If we've exhausted retries, save to localStorage
        if (retryCount >= MAX_RETRIES) {
          saveUnsentMessage(currentConversation._id, content.trim());
          throw new Error('Không có kết nối. Tin nhắn đã được lưu và sẽ gửi lại khi kết nối.');
        }
        
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
//         console.log(`Retrying message send in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendMessage(content, retryCount + 1);
      }
      
      // Create temp message ID for tracking
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      
      // Optimistically add message to UI
      const tempMessage = {
        _id: tempId,
        conversationId: currentConversation._id,
        senderId: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar
        },
        content: content.trim(),
        timestamp: new Date().toISOString(),
        pending: true,
        retryCount
      };
      
      setMessages(prev => ({
        ...prev,
        [currentConversation._id]: [
          ...(prev[currentConversation._id] || []),
          tempMessage
        ]
      }));
      
      // Send via socket with error handling
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          // Timeout after 5 seconds
//           console.error('Message send timeout');
          
          // If we haven't exhausted retries, try again
          if (retryCount < MAX_RETRIES) {
            // Remove temp message
            setMessages(prev => ({
              ...prev,
              [currentConversation._id]: prev[currentConversation._id].filter(
                msg => msg._id !== tempId
              )
            }));
            
            // Retry with exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;
            setTimeout(() => {
              sendMessage(content, retryCount + 1).then(resolve).catch(reject);
            }, delay);
          } else {
            // Exhausted retries - save to localStorage
            saveUnsentMessage(currentConversation._id, content.trim());
            
            // Remove temp message
            setMessages(prev => ({
              ...prev,
              [currentConversation._id]: prev[currentConversation._id].filter(
                msg => msg._id !== tempId
              )
            }));
            
            reject(new Error('Không thể gửi tin nhắn sau 3 lần thử. Tin nhắn đã được lưu.'));
          }
        }, 5000);
        
        // Listen for message sent confirmation
        const handleMessageSent = ({ conversationId, message }) => {
          if (conversationId === currentConversation._id) {
            clearTimeout(timeout);
            socket.off('message:sent', handleMessageSent);
            socket.off('error', handleError);
            resolve(message);
          }
        };
        
        // Listen for errors
        const handleError = (error) => {
          clearTimeout(timeout);
          socket.off('message:sent', handleMessageSent);
          socket.off('error', handleError);
          
          // If we haven't exhausted retries, try again
          if (retryCount < MAX_RETRIES) {
            // Remove temp message
            setMessages(prev => ({
              ...prev,
              [currentConversation._id]: prev[currentConversation._id].filter(
                msg => msg._id !== tempId
              )
            }));
            
            // Retry with exponential backoff
            const delay = Math.pow(2, retryCount) * 1000;
            setTimeout(() => {
              sendMessage(content, retryCount + 1).then(resolve).catch(reject);
            }, delay);
          } else {
            // Exhausted retries - save to localStorage
            saveUnsentMessage(currentConversation._id, content.trim());
            
            // Remove temp message
            setMessages(prev => ({
              ...prev,
              [currentConversation._id]: prev[currentConversation._id].filter(
                msg => msg._id !== tempId
              )
            }));
            
            reject(new Error('Không thể gửi tin nhắn sau 3 lần thử. Tin nhắn đã được lưu.'));
          }
        };
        
        socket.on('message:sent', handleMessageSent);
        socket.on('error', handleError);
        
        // Send via socket
        socket.emit('message:send', {
          conversationId: currentConversation._id,
          content: content.trim()
        });
      });
      
    } catch (err) {
//       console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
      toast.error(err.message || 'Không thể gửi tin nhắn');
      throw err;
    }
  }, [currentConversation, user, context, setMessages, setError, saveUnsentMessage]);

  // Load more messages with pagination
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation) return;
    
    const conversationId = currentConversation._id;
    const pagination = messagePagination[conversationId];
    
    if (!pagination || !pagination.hasMore) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const nextPage = pagination.page + 1;
      const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { page: nextPage, limit: 50 }
      });
      
      if (response.data.success) {
        const { messages: newMessages, pagination: newPagination } = response.data.data;
        
        // Prepend older messages
        setMessages(prev => ({
          ...prev,
          [conversationId]: [
            ...newMessages,
            ...(prev[conversationId] || [])
          ]
        }));
        
        setMessagePagination(prev => ({
          ...prev,
          [conversationId]: {
            page: newPagination.currentPage,
            hasMore: newPagination.hasMore
          }
        }));
      }
    } catch (err) {
//       console.error('Error loading more messages:', err);
      setError(err.response?.data?.error?.message || 'Failed to load more messages');
      toast.error('Không thể tải thêm tin nhắn');
    } finally {
      setLoading(false);
    }
  }, [currentConversation, messagePagination, setMessages, setMessagePagination, setLoading, setError]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId) => {
    if (!conversationId || !user) return;
    
    try {
      await api.post(`/chat/conversations/${conversationId}/read`);
      
      // Update local state - reset unread count to 0
      setConversations(prev => prev.map(conv => {
        if (conv._id === conversationId) {
          return {
            ...conv,
            participants: conv.participants.map(p =>
              p.userId._id === user._id
                ? { ...p, unreadCount: 0, lastReadAt: new Date().toISOString() }
                : p
            )
          };
        }
        return conv;
      }));
      
//       console.log('✅ Marked conversation as read:', conversationId);
      
    } catch (err) {
//       console.error('Error marking as read:', err);
      // Don't show error toast for this, it's not critical
    }
  }, [user, setConversations]);

  return {
    ...context,
    loadConversations,
    selectConversation,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    saveUnsentMessage,
  };
};
