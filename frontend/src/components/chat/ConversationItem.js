import React, { memo, useMemo, forwardRef } from 'react';
import './ConversationItem.css';
import { useAuth } from '../../context/AuthContext';
import { useConversations } from '../../hooks/useConversations';
import OnlineStatus from './OnlineStatus';

/**
 * Component to display a single conversation item
 * - Display participant name and avatar
 * - Display last message content and timestamp
 * - Display unread count badge (red if > 0)
 * - Display online status dot
 * - Keyboard accessible with focus indicators
 * 
 * Validates: Requirements 4.3, 4.4, 5.3, 10.1, 10.2, 10.3
 * Performance: Memoized to prevent unnecessary re-renders (Requirement 12.1, 12.2)
 */
const ConversationItem = memo(forwardRef(({ conversation, isActive, isFocused, onClick, tabIndex }, ref) => {
  const { user } = useAuth();
  const { getOtherParticipant, getConversationUnreadCount } = useConversations();

  const otherParticipant = useMemo(() => {
    return getOtherParticipant(conversation);
  }, [conversation, getOtherParticipant]);

  const unreadCount = useMemo(() => {
    return getConversationUnreadCount(conversation._id);
  }, [conversation._id, getConversationUnreadCount]);

  const lastMessage = conversation.lastMessage;

  // Memoize expensive timestamp formatting (Requirement 12.2)
  const formattedTimestamp = useMemo(() => {
    const timestamp = lastMessage?.timestamp || conversation.updatedAt;
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    if (diffDays < 7) return `${diffDays} ngày`;
    
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  }, [lastMessage, conversation.updatedAt]);

  // Memoize truncated message
  const truncatedMessage = useMemo(() => {
    // Handle missing or invalid lastMessage
    if (!lastMessage || !lastMessage.content || lastMessage.content.trim() === '') {
      return 'Chưa có tin nhắn';
    }
    
    const text = lastMessage.content;
    const maxLength = 50;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }, [lastMessage]);

  if (!otherParticipant) return null;

  const participantUser = otherParticipant.userId;
  
  // Debug logging
  if (!participantUser || !participantUser.name) {
    console.warn('ConversationItem: Missing participant data', {
      conversation: conversation._id,
      otherParticipant,
      participantUser
    });
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div 
      ref={ref}
      className={`conversation-item ${isActive ? 'active' : ''} ${isFocused ? 'focused' : ''}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="listitem"
      tabIndex={tabIndex}
      aria-label={`Cuộc hội thoại với ${participantUser.name}${unreadCount > 0 ? `, ${unreadCount} tin nhắn chưa đọc` : ''}`}
      aria-current={isActive ? 'true' : 'false'}
    >
      <div className="conversation-avatar">
        {participantUser.avatar && participantUser.avatar.trim() !== '' ? (
          <img 
            src={`http://localhost:5000${participantUser.avatar.startsWith('/') ? '' : '/'}${participantUser.avatar}`}
            alt={`Ảnh đại diện của ${participantUser.name}`}
            onError={(e) => {
              console.log('Avatar load error:', participantUser.avatar);
              e.target.style.display = 'none';
              if (e.target.nextElementSibling) {
                e.target.nextElementSibling.style.display = 'flex';
              }
            }}
            onLoad={(e) => {
              console.log('Avatar loaded successfully:', participantUser.avatar);
            }}
          />
        ) : null}
        <div 
          className="avatar-placeholder" 
          style={{ display: (participantUser.avatar && participantUser.avatar.trim() !== '') ? 'none' : 'flex' }}
          aria-hidden="true"
        >
          {participantUser.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <OnlineStatus userId={participantUser._id} />
      </div>

      <div className="conversation-content">
        <div className="conversation-header">
          <h4 className="conversation-name">{participantUser.name}</h4>
          <span className="conversation-time" aria-label={`Thời gian: ${formattedTimestamp}`}>
            {formattedTimestamp}
          </span>
        </div>

        <div className="conversation-footer">
          <p className="conversation-message">
            {lastMessage?.senderId === user?._id && 'Bạn: '}
            {truncatedMessage}
          </p>
          {unreadCount > 0 && (
            <span className="unread-badge" aria-label={`${unreadCount} tin nhắn chưa đọc`}>
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}));

ConversationItem.displayName = 'ConversationItem';

export default ConversationItem;
