import React from 'react';
import './OnlineStatus.css';
import { useConversations } from '../../hooks/useConversations';

/**
 * Component to display online status indicator
 * - Display green dot for online, gray for offline
 * - Update in real-time based on socket events
 * 
 * Validates: Requirements 5.3, 5.4
 */
const OnlineStatus = ({ userId }) => {
  const { isUserOnline } = useConversations();
  
  if (!userId) return null;

  const online = isUserOnline(userId);

  return (
    <div className={`online-status ${online ? 'online' : 'offline'}`}>
      <span className="status-dot"></span>
    </div>
  );
};

export default OnlineStatus;
