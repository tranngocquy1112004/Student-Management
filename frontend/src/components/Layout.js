import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import UserDropdown from './UserDropdown';
import ProfileModal from './ProfileModal';
import ChangePasswordModal from './ChangePasswordModal';
import './Layout.css';

const Layout = ({ children, sidebar }) => {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const avatarRef = useRef();

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
