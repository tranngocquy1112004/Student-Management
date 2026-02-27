import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import './Table.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const socket = useSocket();

  useEffect(() => { api.get('/notifications').then(({ data }) => setNotifications(data.data)); }, []);
  useEffect(() => {
    if (!socket) return;
    socket.on('notification', (data) => {
      toast.success(data.title);
      setNotifications(prev => [{ ...data, _id: Date.now(), isRead: false, createdAt: new Date() }, ...prev]);
    });
    return () => socket.off('notification');
  }, [socket]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="page">
      <h1>Thông báo</h1>
      <div className="notification-list">
        {notifications.map((n) => (
          <div key={n._id} className={`notification-item ${n.isRead ? '' : 'unread'}`} onClick={() => !n.isRead && markRead(n._id)}>
            <h4>{n.title}</h4>
            <p>{n.content}</p>
            <small>{new Date(n.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
