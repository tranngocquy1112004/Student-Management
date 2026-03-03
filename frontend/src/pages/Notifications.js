import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import './Table.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { socket, connected } = useSocket();

  useEffect(() => { 
    api.get('/notifications').then(({ data }) => setNotifications(data.data)); 
  }, []);

  useEffect(() => {
    if (!socket || !connected) return;
    
    const handleNotification = (data) => {
      toast.success(`📢 ${data.title}`);
      setNotifications(prev => [{ 
        ...data, 
        _id: Date.now(), 
        isRead: false, 
        createdAt: new Date() 
      }, ...prev]);
    };

    socket.on('notification', handleNotification);
    
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, connected]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      
      // Emit event to update unread count in Layout
      if (socket && connected) {
        socket.emit('notification:read');
      }
    } catch (err) {
      toast.error('Không thể đánh dấu đã đọc');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả là đã đọc');
      
      // Emit event to update unread count in Layout
      if (socket && connected) {
        socket.emit('notification:read');
      }
    } catch (err) {
      toast.error('Không thể đánh dấu tất cả');
    }
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Thông báo</h1>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={markAllRead}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px rgba(79, 70, 229, 0.3)'
            }}
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            Không có thông báo nào
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n._id} 
              className={`notification-item ${n.isRead ? '' : 'unread'}`} 
              onClick={() => !n.isRead && markRead(n._id)}
              style={{
                padding: 16,
                marginBottom: 12,
                background: n.isRead ? 'var(--bg-secondary)' : 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
                borderRadius: 12,
                cursor: n.isRead ? 'default' : 'pointer',
                border: n.isRead ? '1px solid var(--border-color)' : '2px solid rgba(79, 70, 229, 0.3)',
                transition: 'all 0.2s ease',
                boxShadow: n.isRead ? 'none' : '0 2px 8px rgba(79, 70, 229, 0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ 
                    margin: '0 0 8px 0', 
                    color: 'var(--text-primary)',
                    fontWeight: n.isRead ? 500 : 700
                  }}>
                    {!n.isRead && <span style={{ color: '#ef4444', marginRight: 8 }}>●</span>}
                    {n.title}
                  </h4>
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    color: 'var(--text-secondary)',
                    fontSize: '0.95rem'
                  }}>
                    {n.content}
                  </p>
                  <small style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                    {new Date(n.createdAt).toLocaleString('vi-VN')}
                  </small>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
