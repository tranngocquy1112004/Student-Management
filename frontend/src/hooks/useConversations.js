import { useCallback, useEffect } from 'react';
import { useChat as useChatContext } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

export const useConversations = () => {
  const context = useChatContext();
  const { user } = useAuth();
  
  const {
    conversations,
    setConversations,
    getOtherParticipant,
  } = context;

  // Sort conversations by updatedAt (most recent first)
  const sortedConversations = useCallback(() => {
    return [...conversations].sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt);
      const dateB = new Date(b.updatedAt || b.createdAt);
      return dateB - dateA;
    });
  }, [conversations]);

  // Get unread count for a specific conversation
  const getConversationUnreadCount = useCallback((conversationId) => {
    if (!user) return 0;
    
    const conversation = conversations.find(c => c._id === conversationId);
    if (!conversation) return 0;
    
    const participant = conversation.participants.find(p => p.userId._id === user._id);
    return participant?.unreadCount || 0;
  }, [conversations, user]);

  // Handle conversation update from socket (will be used in Task 11)
  const handleConversationUpdate = useCallback((updatedConversation) => {
    setConversations(prev => {
      const exists = prev.find(c => c._id === updatedConversation._id);
      
      if (exists) {
        // Update existing conversation
        return prev.map(c =>
          c._id === updatedConversation._id ? updatedConversation : c
        );
      } else {
        // Add new conversation
        return [updatedConversation, ...prev];
      }
    });
  }, [setConversations]);

  // Handle new message received (update conversation's lastMessage)
  const handleNewMessage = useCallback((message) => {
    setConversations(prev => prev.map(conv => {
      if (conv._id === message.conversationId) {
        // Update last message
        const updatedConv = {
          ...conv,
          lastMessage: {
            content: message.content,
            senderId: message.senderId._id || message.senderId,
            timestamp: message.timestamp
          },
          updatedAt: message.timestamp
        };
        
        // Increment unread count if message is not from current user
        if (user && message.senderId._id !== user._id) {
          updatedConv.participants = conv.participants.map(p =>
            p.userId._id === user._id
              ? { ...p, unreadCount: (p.unreadCount || 0) + 1 }
              : p
          );
        }
        
        return updatedConv;
      }
      return conv;
    }));
  }, [user, setConversations]);

  // Filter conversations by search query
  const filterConversations = useCallback((query) => {
    if (!query || !query.trim()) {
      return sortedConversations();
    }
    
    const searchTerm = query.toLowerCase().trim();
    
    return sortedConversations().filter(conv => {
      const otherParticipant = getOtherParticipant(conv);
      if (!otherParticipant) return false;
      
      const name = otherParticipant.userId.name?.toLowerCase() || '';
      const email = otherParticipant.userId.email?.toLowerCase() || '';
      const lastMessage = conv.lastMessage?.content?.toLowerCase() || '';
      
      return name.includes(searchTerm) || 
             email.includes(searchTerm) || 
             lastMessage.includes(searchTerm);
    });
  }, [sortedConversations, getOtherParticipant]);

  // Get conversation by ID
  const getConversationById = useCallback((conversationId) => {
    return conversations.find(c => c._id === conversationId);
  }, [conversations]);

  // Check if user is online
  const isUserOnline = useCallback((userId) => {
    return context.onlineUsers.has(userId);
  }, [context.onlineUsers]);

  return {
    conversations: sortedConversations(),
    getConversationUnreadCount,
    handleConversationUpdate,
    handleNewMessage,
    filterConversations,
    getConversationById,
    isUserOnline,
    getOtherParticipant,
  };
};
