import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatLayout } from '../components/chat';
import { useChat } from '../hooks/useChat';
import { toast } from 'react-toastify';

const Chat = () => {
  const [searchParams] = useSearchParams();
  const { 
    selectConversation, 
    loadConversations, 
    conversations,
    notificationPermission,
    requestNotificationPermission,
    markAsRead,
    currentConversation
  } = useChat();
  
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Mark current conversation as read when it changes
  useEffect(() => {
    if (currentConversation?._id) {
      markAsRead(currentConversation._id);
    }
  }, [currentConversation, markAsRead]);

  // Check for conversation ID in URL (from notification click)
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    
    if (conversationId && conversations.length > 0) {
      console.log('Opening conversation from notification:', conversationId);
      
      // Select the conversation
      selectConversation(conversationId);
      
      // Clear the URL parameter
      window.history.replaceState({}, '', '/chat');
    }
  }, [searchParams, conversations, selectConversation]);

  // Request notification permission on first interaction
  useEffect(() => {
    // Check if we should show permission prompt
    if (notificationPermission === 'default' && !localStorage.getItem('notification_prompt_shown')) {
      setShowPermissionPrompt(true);
    }
  }, [notificationPermission]);

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
      toast.success('Đã bật thông báo trình duyệt');
    } else if (permission === 'denied') {
      toast.error('Bạn đã từ chối quyền thông báo. Vui lòng bật lại trong cài đặt trình duyệt.');
    }
    
    // Mark that we've shown the prompt
    localStorage.setItem('notification_prompt_shown', 'true');
    setShowPermissionPrompt(false);
  };

  const handleDismissPermission = () => {
    localStorage.setItem('notification_prompt_shown', 'true');
    setShowPermissionPrompt(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Notification Permission Prompt */}
      {showPermissionPrompt && (
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          color: 'white',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
              🔔 Bật thông báo tin nhắn
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              Nhận thông báo khi có tin nhắn mới ngay cả khi không mở trang chat
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDismissPermission}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              Để sau
            </button>
            <button
              onClick={handleRequestPermission}
              style={{
                background: 'white',
                border: 'none',
                color: '#4f46e5',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Bật thông báo
            </button>
          </div>
        </div>
      )}

      {/* Chat Layout */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatLayout />
      </div>
    </div>
  );
};

export default Chat;
