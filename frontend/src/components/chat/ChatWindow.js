import React from 'react';
import './ChatWindow.css';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import OnlineStatus from './OnlineStatus';
import { useChat } from '../../hooks/useChat';
import { useConversations } from '../../hooks/useConversations';

/**
 * Main chat window component
 * Displays the active conversation with messages, input, and typing indicator
 */
const ChatWindow = ({ onBackToList }) => {
  const { currentConversation } = useChat();
  const { getOtherParticipant } = useConversations();

  if (!currentConversation) {
    return (
      <div className="chat-window-empty">
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>Chọn một cuộc hội thoại</h3>
          <p>Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu nhắn tin</p>
        </div>
      </div>
    );
  }

  const otherParticipant = getOtherParticipant(currentConversation);
  const participantUser = otherParticipant?.userId;

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <button 
          className="back-button mobile-only"
          onClick={onBackToList}
          title="Quay lại danh sách"
        >
          ←
        </button>

        <div className="chat-header-info">
          <div className="chat-header-avatar">
            {participantUser?.avatar && participantUser.avatar.trim() !== '' ? (
              <>
                <img 
                  src={`http://localhost:5000${participantUser.avatar.startsWith('/') ? '' : '/'}${participantUser.avatar}`}
                  alt={participantUser.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
                <div className="avatar-placeholder" style={{ display: 'none' }}>
                  {participantUser?.name?.charAt(0).toUpperCase() || '?'}
                </div>
              </>
            ) : (
              <div className="avatar-placeholder">
                {participantUser?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <OnlineStatus userId={participantUser?._id} />
          </div>

          <div className="chat-header-details">
            <h3 className="chat-header-name">{participantUser?.name || 'Unknown'}</h3>
            <p className="chat-header-role">
              {participantUser?.role === 'admin' && 'Quản trị viên'}
              {participantUser?.role === 'teacher' && 'Giáo viên'}
              {participantUser?.role === 'student' && 'Học sinh'}
            </p>
          </div>
        </div>
      </div>

      <MessageList conversationId={currentConversation._id} />
      
      <TypingIndicator conversationId={currentConversation._id} />
      
      <MessageInput conversationId={currentConversation._id} />
    </div>
  );
};

export default ChatWindow;
