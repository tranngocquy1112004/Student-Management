import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import UserDropdown from './UserDropdown';
import ProfileModal from './ProfileModal';
import ChangePasswordModal from './ChangePasswordModal';
import './Layout.css';

const Layout = ({ children, sidebar }) => {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const { socket, connected } = useSocket();
  const { unreadCount: chatUnreadCount } = useChat();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const avatarRef = useRef();

  // Fetch unread count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const api = (await import('../api/axios')).default;
        const { data } = await api.get('/notifications/unread-count');
        setUnreadCount(data.data.count);
      } catch (err) {

      }
    };

    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  // Listen for new notifications via Socket.io
  useEffect(() => {
    if (!socket || !connected) {

      return;
    }

    const handleNotification = (data) => {

      setUnreadCount(prev => {

        return prev + 1;
      });
      
      // Optional: Show toast notification
      if (window.toast) {
        window.toast.info(`📢 ${data.title}`);
      }
    };

    const handleNotificationRead = () => {

      // Refresh unread count when notification is marked as read
      fetchUnreadCount();
    };

    socket.on('notification', handleNotification);
    socket.on('notification:read', handleNotificationRead);

    return () => {

      socket.off('notification', handleNotification);
      socket.off('notification:read', handleNotificationRead);
    };
  }, [socket, connected]);

  const fetchUnreadCount = async () => {
    try {
      const api = (await import('../api/axios')).default;
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.data.count);
    } catch (err) {

    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const api = (await import('../api/axios')).default;
      const { data } = await api.put('/auth/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(localStorage.getItem('user') || '{}'), avatar: data.data.avatar }));
      window.location.reload();
    } catch (err) {}
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleBroadcastClick = () => {
    navigate('/admin/broadcast');
  };

  return (
    <div className="layout">
      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <h2>QL Lớp Học</h2>
        </div>
        <nav className="sidebar-nav">
          {sidebar}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="user-info">
            <button onClick={toggleTheme} style={{ marginRight: 16 }}>{dark ? '☀️' : '🌙'}</button>
            
            {/* Admin Broadcast Button */}
            {user?.role === 'admin' && (
              <button 
                className="broadcast-button" 
                onClick={handleBroadcastClick}
                style={{ 
                  marginRight: 16,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                }}
              >
                <span>📢</span>
                <span className="broadcast-text">Gửi thông báo</span>
              </button>
            )}

            {/* Notification Bell */}
            <button 
              className="notification-bell" 
              onClick={handleNotificationClick}
              style={{ 
                position: 'relative', 
                marginRight: 16, 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '20px',
                padding: '8px',
                borderRadius: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              🔔
              {(unreadCount + chatUnreadCount) > 0 && (
                <span 
                  className="notification-badge"
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                    animation: 'pulse 2s infinite'
                  }}
                >
                  {(unreadCount + chatUnreadCount) > 99 ? '99+' : (unreadCount + chatUnreadCount)}
                </span>
              )}
            </button>

            <UserDropdown 
              onOpenProfile={() => setShowProfileModal(true)}
              onOpenChangePassword={() => setShowChangePasswordModal(true)}
            />
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>

      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}

      {showChangePasswordModal && (
        <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} />
      )}
    </div>
  );
};

export default Layout;
