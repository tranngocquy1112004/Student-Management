import React, { useEffect, useState } from 'react';
import './TypingIndicator.css';
import { useMessages } from '../../hooks/useMessages';

const AUTO_HIDE_MS = 3000;

/**
 * Component to display typing indicator
 * - Display "[Name] đang gõ..." when typing event received
 * - Auto-hide after 3 seconds
 * 
 * Validates: Requirements 6.3
 */
const TypingIndicator = ({ conversationId }) => {
  const { getTypingIndicator } = useMessages(conversationId);
  const [visible, setVisible] = useState(false);
  const [hideTimeout, setHideTimeout] = useState(null);

  const typingInfo = getTypingIndicator();

  useEffect(() => {
    if (typingInfo) {
      setVisible(true);

      // Clear previous timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }

      // Auto-hide after 3 seconds
      const timeout = setTimeout(() => {
        setVisible(false);
      }, AUTO_HIDE_MS);

      setHideTimeout(timeout);

      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    } else {
      setVisible(false);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    }
  }, [typingInfo]);

  if (!visible || !typingInfo) {
    return null;
  }

  return (
    <div className="typing-indicator">
      <div className="typing-indicator-content">
        <span className="typing-text">
          {typingInfo.userName} đang gõ
        </span>
        <div className="typing-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
