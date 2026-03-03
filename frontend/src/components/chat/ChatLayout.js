import React, { useState, useEffect, useCallback } from 'react';
import './ChatLayout.css';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import ConnectionStatus from './ConnectionStatus';

/**
 * Main chat layout component with responsive design
 * Desktop: 30% sidebar, 70% chat
 * Tablet: 40% sidebar, 60% chat
 * Mobile: Full screen toggle between list and chat
 * Keyboard navigation: Escape to close chat on mobile
 * 
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */
const ChatLayout = () => {
  const [showChat, setShowChat] = useState(false);

  const handleConversationSelect = () => {
    // On mobile, switch to chat view when conversation is selected
    setShowChat(true);
  };

  const handleBackToList = () => {
    // On mobile, switch back to conversation list
    setShowChat(false);
  };

  // Keyboard navigation: Escape to close chat
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && showChat) {
      e.preventDefault();
      handleBackToList();
    }
  }, [showChat]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className="chat-layout" role="main" aria-label="Giao diện chat">
      <ConnectionStatus />
      
      <div 
        className={`chat-sidebar ${showChat ? 'mobile-hidden' : ''}`}
        role="complementary"
        aria-label="Danh sách cuộc hội thoại"
      >
        <ConversationList onConversationSelect={handleConversationSelect} />
      </div>
      
      <div 
        className={`chat-main ${!showChat ? 'mobile-hidden' : ''}`}
        role="region"
        aria-label="Cửa sổ chat"
      >
        <ChatWindow onBackToList={handleBackToList} />
      </div>
    </div>
  );
};

export default ChatLayout;
