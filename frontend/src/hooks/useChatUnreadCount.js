import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

/**
 * Hook to get chat unread count globally (outside ChatContext)
 * Listens to socket events to update count in real-time
 */
export const useChatUnreadCount = () => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  // Fetch chat unread count on mount
  useEffect(() => {
    const fetchChatUnreadCount = async () => {
      try {
        const api = (await import('../api/axios')).default;
        const { data } = await api.get('/chat/unread-count');
        setChatUnreadCount(data.data.count);
      } catch (err) {
        console.error('Failed to fetch chat unread count:', err);
      }
    };

    if (user) {
      fetchChatUnreadCount();
    }
  }, [user]);

  // Listen for chat events to update unread count
  useEffect(() => {
    if (!socket || !connected) {
      return;
    }

    const fetchChatUnreadCount = async () => {
      try {
        const api = (await import('../api/axios')).default;
        const { data } = await api.get('/chat/unread-count');
        setChatUnreadCount(data.data.count);
      } catch (err) {
        console.error('Failed to fetch chat unread count:', err);
      }
    };

    const handleChatMessage = () => {
      // Refresh chat unread count when new message arrives
      fetchChatUnreadCount();
    };

    const handleConversationUpdated = () => {
      // Refresh chat unread count when conversation is updated (e.g., marked as read)
      fetchChatUnreadCount();
    };

    socket.on('message:receive', handleChatMessage);
    socket.on('conversation:updated', handleConversationUpdated);

    return () => {
      socket.off('message:receive', handleChatMessage);
      socket.off('conversation:updated', handleConversationUpdated);
    };
  }, [socket, connected]);

  return chatUnreadCount;
};
