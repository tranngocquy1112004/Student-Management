import React from 'react';
import { useChat } from '../../context/ChatContext';
import './ConnectionStatus.css';

/**
 * Component to display socket connection status
 */
const ConnectionStatus = () => {
  const { connectionStatus } = useChat();

  // Don't show anything when connected
  if (connectionStatus === 'connected') {
    return null;
  }

  const getStatusInfo = () => {
    switch (connectionStatus) {
      case 'disconnected':
        return {
          text: 'Mất kết nối',
          className: 'connection-status-disconnected',
          icon: '🔴'
        };
      case 'reconnecting':
        return {
          text: 'Đang kết nối lại...',
          className: 'connection-status-reconnecting',
          icon: '🟡'
        };
      case 'error':
        return {
          text: 'Lỗi kết nối',
          className: 'connection-status-error',
          icon: '❌'
        };
      case 'failed':
        return {
          text: 'Không thể kết nối. Vui lòng tải lại trang.',
          className: 'connection-status-failed',
          icon: '❌'
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  return (
    <div className={`connection-status ${statusInfo.className}`}>
      <span className="connection-status-icon">{statusInfo.icon}</span>
      <span className="connection-status-text">{statusInfo.text}</span>
    </div>
  );
};

export default ConnectionStatus;
