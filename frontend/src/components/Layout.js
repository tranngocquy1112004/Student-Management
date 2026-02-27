import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Layout.css';

const Layout = ({ children, sidebar }) => {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const avatarRef = useRef();

  const handleLogout = () => {
    logout();
    navigate('/login');
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

  const roleLabel = { admin: 'Quản trị', teacher: 'Giảng viên', student: 'Học sinh' };
  const avatarUrl = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : (process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000') + user.avatar) : null;

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
            <label style={{ cursor: 'pointer' }}>
              <input type="file" accept="image/*" ref={avatarRef} onChange={handleAvatarChange} style={{ display: 'none' }} />
              {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : <span>👤</span>}
            </label>
            <span>{user?.name}</span>
            <span className="role-badge">{roleLabel[user?.role]}</span>
            <button onClick={toggleTheme}>{dark ? '☀️' : '🌙'}</button>
            <button onClick={handleLogout} className="btn-logout">Đăng xuất</button>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
