import React, { useEffect, useState, useRef, useCallback } from 'react';
import './ConversationList.css';
import ConversationItem from './ConversationItem';
import UserSearch from './UserSearch';
import { useChat } from '../../hooks/useChat';
import { useConversations } from '../../hooks/useConversations';
import { useAuth } from '../../context/AuthContext';

/**
 * Component to display list of conversations
 * - Display list sorted by updatedAt
 * - Show last message preview
 * - Show unread count badge
 * - Show online status indicator
 * - Handle conversation selection
 * - Keyboard navigation: Arrow keys to navigate, Enter to select
 * 
 * Validates: Requirements 1.4, 1.5, 1.6, 4.3, 4.4, 5.3, 10.1, 10.2, 10.3
 */
const ConversationList = ({ onConversationSelect }) => {
  const { selectConversation, currentConversation, loading } = useChat();
  const { conversations, filterConversations } = useConversations();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const conversationRefs = useRef([]);
  const autoSelectAttempted = useRef(false);

  // Auto-select first conversation on initial load - only once
  useEffect(() => {
    // Only auto-select if:
    // 1. Haven't attempted auto-select yet
    // 2. No conversation is currently selected
    // 3. Conversations are loaded (length > 0)
    // 4. Not currently loading
    // 5. User is available
    if (!autoSelectAttempted.current && !currentConversation && conversations.length > 0 && !loading && user) {
      // Mark as attempted immediately to prevent double-selection
      autoSelectAttempted.current = true;
      
      // Find first conversation where current user is a participant
      const userConversations = conversations.filter(conv => 
        conv.participants.some(p => p.userId._id === user._id)
      );
      
      if (userConversations.length > 0) {
        const firstConversation = userConversations[0];

        selectConversation(firstConversation._id);
      } else {

        // If admin, may still select first conversation to view
        if (user?.role === 'admin' && conversations.length > 0) {

          selectConversation(conversations[0]._id);
        }
      }
    }
  }, [conversations, currentConversation, loading, selectConversation, user]);

  const handleConversationClick = async (conversationId) => {
    await selectConversation(conversationId);
    if (onConversationSelect) {
      onConversationSelect();
    }
  };

  const displayedConversations = searchQuery 
    ? filterConversations(searchQuery)
    : conversations;

  const handleNewChatClick = () => {
    setShowUserSearch(true);
  };

  const handleUserSearchClose = () => {
    setShowUserSearch(false);
  };

  const handleUserSelect = () => {
    setShowUserSearch(false);
    if (onConversationSelect) {
      onConversationSelect();
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e) => {
    const conversationCount = displayedConversations.length;
    
    if (conversationCount === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev < conversationCount - 1 ? prev + 1 : prev;
          return next;
        });
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev > 0 ? prev - 1 : prev;
          return next;
        });
        break;
      
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < conversationCount) {
          const conversation = displayedConversations[focusedIndex];
          handleConversationClick(conversation._id);
        }
        break;
      
      case 'Tab':
        // Allow default tab behavior
        break;
      
      default:
        break;
    }
  }, [displayedConversations, focusedIndex]);

  // Focus the conversation item when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && conversationRefs.current[focusedIndex]) {
      conversationRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Reset focused index when conversations change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [displayedConversations.length]);

  // If user search is open, show it instead of conversation list
  if (showUserSearch) {
    return (
      <UserSearch 
        onUserSelect={handleUserSelect}
        onClose={handleUserSearchClose}
      />
    );
  }

  return (
    <div className="conversation-list" onKeyDown={handleKeyDown}>
      <div className="conversation-list-header">
        <div className="conversation-header-top">
          <h2>Tin nhắn</h2>
          <button 
            className="new-chat-button" 
            onClick={handleNewChatClick}
            title="Tạo cuộc hội thoại mới"
            aria-label="Tạo cuộc hội thoại mới"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="conversation-search">
          <input
            type="text"
            placeholder="Tìm kiếm cuộc hội thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            aria-label="Tìm kiếm cuộc hội thoại"
          />
        </div>
      </div>

      <div className="conversation-list-body" role="list" aria-label="Danh sách cuộc hội thoại">
        {loading && conversations.length === 0 ? (
          <div className="conversation-list-loading" role="status" aria-live="polite">
            <div className="loading-spinner"></div>
            <p>Đang tải...</p>
          </div>
        ) : displayedConversations.length === 0 ? (
          <div className="conversation-list-empty" role="status">
            <p>
              {searchQuery 
                ? 'Không tìm thấy cuộc hội thoại nào'
                : 'Chưa có cuộc hội thoại nào'}
            </p>
          </div>
        ) : (
          displayedConversations.map((conversation, index) => (
            <ConversationItem
              key={conversation._id}
              ref={el => conversationRefs.current[index] = el}
              conversation={conversation}
              isActive={currentConversation?._id === conversation._id}
              isFocused={focusedIndex === index}
              onClick={() => handleConversationClick(conversation._id)}
              tabIndex={0}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
