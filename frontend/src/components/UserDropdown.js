import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './UserDropdown.css';

const UserDropdown = ({ onOpenProfile, onOpenChangePassword }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const roleLabel = { 
    admin: 'Quản trị', 
    teacher: 'Giảng viên', 
    student: 'Sinh viên' 
  };

  const avatarUrl = user?.avatar 
    ? (user.avatar.startsWith('http') 
        ? user.avatar 
        : (process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000') + user.avatar)
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setIsOpen(false);
    onOpenProfile();
  };

  const handleChangePasswordClick = () => {
    setIsOpen(false);
    onOpenChangePassword();
  };

  return (
    <div className="user-dropdown-container" ref={dropdownRef}>
      <button 
        className="user-dropdown-trigger" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={user?.name} 
            className="user-avatar"
          />
        ) : (
          <span className="user-avatar-placeholder">👤</span>
        )}
        <div className="user-info-text">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{roleLabel[user?.role]}</span>
        </div>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="user-dropdown-menu">
          <div className="dropdown-header">
            <div className="dropdown-user-info">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.name} className="dropdown-avatar" />
              ) : (
                <span className="dropdown-avatar-placeholder">👤</span>
              )}
              <div>
                <div className="dropdown-user-name">{user?.name}</div>
                <div className="dropdown-user-email">{user?.email}</div>
              </div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <button className="dropdown-item" onClick={handleProfileClick}>
            <span className="dropdown-icon">👤</span>
            <span>Thông tin cá nhân</span>
          </button>

          <button className="dropdown-item" onClick={handleChangePasswordClick}>
            <span className="dropdown-icon">🔐</span>
            <span>Đổi mật khẩu</span>
          </button>

          <div className="dropdown-divider"></div>

          <button className="dropdown-item logout" onClick={handleLogout}>
            <span className="dropdown-icon">🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
