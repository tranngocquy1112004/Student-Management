import React, { useState, useRef, useEffect, useCallback } from 'react';
import './MessageInput.css';
import { useChat } from '../../hooks/useChat';
import { toast } from 'react-toastify';

const MAX_CHARS = 1000;
const TYPING_DEBOUNCE_MS = 3000;

/**
 * Component for message input
 * - Auto-resize textarea
 * - Character limit (1000 chars) with counter
 * - Enter to send, Shift+Enter for new line
 * - Emit typing indicator (debounced 3s)
 * - Disable when not connected
 * - Accessible with ARIA labels
 * 
 * Validates: Requirements 2.1, 6.1, 6.2, 10.1, 10.2, 10.3
 */
const MessageInput = ({ conversationId }) => {
  const { sendMessage, connectionStatus, getSocket } = useChat();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const isConnected = connectionStatus === 'connected';
  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [content]);

  // Emit typing indicator
  const emitTypingStart = useCallback(() => {
    if (!conversationId || !isConnected) return;

    const socket = getSocket();
    if (socket && socket.connected && !isTypingRef.current) {
      socket.emit('typing:start', { conversationId });
      isTypingRef.current = true;
    }
  }, [conversationId, isConnected, getSocket]);

  const emitTypingStop = useCallback(() => {
    if (!conversationId || !isConnected) return;

    const socket = getSocket();
    if (socket && socket.connected && isTypingRef.current) {
      socket.emit('typing:stop', { conversationId });
      isTypingRef.current = false;
    }
  }, [conversationId, isConnected, getSocket]);

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    if (!content.trim()) {
      emitTypingStop();
      return;
    }

    emitTypingStart();

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
    }, TYPING_DEBOUNCE_MS);
  }, [content, emitTypingStart, emitTypingStop]);

  useEffect(() => {
    handleTyping();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [handleTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      emitTypingStop();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [emitTypingStop]);

  const handleChange = (e) => {
    setContent(e.target.value);
  };

  const handleKeyDown = (e) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    if (isOverLimit) {
      toast.error(`Tin nhắn không được vượt quá ${MAX_CHARS} ký tự`);
      return;
    }

    if (!isConnected) {
      toast.error('Không có kết nối. Vui lòng thử lại sau.');
      return;
    }

    if (!conversationId) {
      toast.error('Vui lòng chọn một cuộc hội thoại');
      return;
    }

    try {
      setIsSending(true);
      
      // Stop typing indicator immediately when sending
      emitTypingStop();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      await sendMessage(trimmedContent);
      setContent('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Error is already handled in useChat hook
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="message-input">
      <div className="message-input-wrapper">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? 'Nhập tin nhắn...' : 'Đang kết nối...'}
          disabled={!isConnected || isSending || !conversationId}
          className="message-textarea"
          rows={1}
          aria-label="Nhập tin nhắn"
          aria-describedby="char-counter connection-status"
        />
        
        <button
          onClick={handleSend}
          disabled={!content.trim() || isOverLimit || !isConnected || isSending || !conversationId}
          className="send-button"
          title="Gửi tin nhắn (Enter)"
          aria-label="Gửi tin nhắn"
        >
          {isSending ? '⏳' : '📤'}
        </button>
      </div>

      <div className="message-input-footer">
        <span 
          id="char-counter"
          className={`char-counter ${isOverLimit ? 'over-limit' : ''}`}
          aria-live="polite"
          aria-atomic="true"
        >
          {charCount}/{MAX_CHARS}
        </span>
        
        {!isConnected && (
          <span 
            id="connection-status"
            className="connection-warning"
            role="alert"
            aria-live="assertive"
          >
            ⚠️ Không có kết nối
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageInput;
