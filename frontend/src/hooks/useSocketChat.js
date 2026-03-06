import { useCallback, useEffect, useRef } from 'react';
import { useChat as useChatContext } from '../context/ChatContext';

/**
 * Hook for socket-based chat operations
 * Handles joining/leaving conversation rooms and typing indicators
 */
export const useSocketChat = (conversationId) => {
  const context = useChatContext();
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Join conversation room when conversation is selected
  useEffect(() => {
    if (!conversationId) return;

    const socket = context.getSocket();
    if (!socket || !socket.connected) return;

    socket.emit('conversation:join', { conversationId });

    // Leave room on cleanup
    return () => {

      socket.emit('conversation:leave', { conversationId });
      
      // Stop typing indicator if active
      if (isTypingRef.current) {
        socket.emit('typing:stop', { conversationId });
        isTypingRef.current = false;
      }
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId, context]);

  // Emit typing start indicator
  const startTyping = useCallback(() => {
    if (!conversationId) return;

    const socket = context.getSocket();
    if (!socket || !socket.connected) return;

    // Only emit if not already typing
    if (!isTypingRef.current) {

      socket.emit('typing:start', { conversationId });
      isTypingRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [conversationId, context]);

  // Emit typing stop indicator
  const stopTyping = useCallback(() => {
    if (!conversationId) return;

    const socket = context.getSocket();
    if (!socket || !socket.connected) return;

    if (isTypingRef.current) {

      socket.emit('typing:stop', { conversationId });
      isTypingRef.current = false;
    }

    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId, context]);

  // Handle input change (for typing indicator)
  const handleTyping = useCallback(() => {
    startTyping();
  }, [startTyping]);

  // Handle message send (stop typing)
  const handleMessageSend = useCallback(() => {
    stopTyping();
  }, [stopTyping]);

  return {
    startTyping,
    stopTyping,
    handleTyping,
    handleMessageSend,
  };
};
