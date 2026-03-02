import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import './ConfirmModal.css';

const ChangePasswordModal = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (passwords.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      toast.success('Đổi mật khẩu thành công');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h3>Đổi mật khẩu</h3>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label>Mật khẩu hiện tại:</label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              placeholder="Nhập mật khẩu hiện tại"
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Mật khẩu mới:</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              required
            />
            <small style={{ color: '#666', display: 'block', marginTop: 4 }}>
              Mật khẩu phải có ít nhất 6 ký tự
            </small>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Xác nhận mật khẩu mới:</label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              placeholder="Nhập lại mật khẩu mới"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
