import React, { memo, useMemo } from 'react';
import './MessageItem.css';

/**
 * Component to display a single message
 * - Display message content
 * - Display sender name and avatar
 * - Display timestamp
 * - Different styling for sent vs received messages
 * - Show retry status for pending/failed messages
 * 
 * Validates: Requirements 3.4, 11.3, 11.5
 * Performance: Memoized to prevent unnecessary re-renders (Requirement 12.1, 12.2)
 */
const MessageItem = memo(({ message, isOwn, showSenderInfo, formatTime }) => {
  // Memoize expensive computations (Requirement 12.2)
  const formattedTime = useMemo(() => {
    if (!message) return '';
    return formatTime(message.timestamp);
  }, [formatTime, message]);

  // Determine status icon and text - memoized
  const statusInfo = useMemo(() => {
    if (!message || !message.pending) return null;
    
    const retryCount = message.retryCount || 0;
    
    if (retryCount === 0) {
      return { icon: '⏳', text: 'Đang gửi...' };
    } else if (retryCount === 1) {
      return { icon: '🔄', text: 'Đang thử lại (1/3)...' };
    } else if (retryCount === 2) {
      return { icon: '🔄', text: 'Đang thử lại (2/3)...' };
    } else if (retryCount >= 3) {
      return { icon: '❌', text: 'Gửi thất bại. Đã lưu.' };
    }
    
    return { icon: '⏳', text: 'Đang gửi...' };
  }, [message]);

  if (!message) {
    console.error('❌ MessageItem: No message provided');
    return null;
  }

  // Extract sender info safely
  const sender = typeof message.senderId === 'object' ? message.senderId : null;
  const senderName = sender?.name || 'Unknown';
  const senderAvatar = sender?.avatar;
  const isPending = message.pending || false;
  const retryCount = message.retryCount || 0;
  
  // Ensure content is always a string
  const messageContent = (message.content || '').toString().trim();

  // Debug log for empty or invalid messages
  if (!messageContent) {
    console.error('❌ Empty or invalid message content:', {
      messageId: message._id,
      hasContent: !!message.content,
      contentType: typeof message.content,
      contentValue: message.content,
      senderId: message.senderId,
      senderIdType: typeof message.senderId,
      isPending: message.pending,
      isOwn,
      fullMessage: message
    });
    return null; // Don't render empty messages
  }

  return (
    <div className={`message-item ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content-wrapper">
        <div className={`message-bubble ${isPending ? 'pending' : ''} ${retryCount >= 3 ? 'failed' : ''}`}>
          <p className="message-text">{messageContent}</p>
          <span className="message-time">{formattedTime}</span>
          
          {statusInfo && (
            <div className="message-status">
              <span className="message-status-icon">{statusInfo.icon}</span>
              <span className="message-status-text">{statusInfo.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;
