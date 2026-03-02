import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import './ConfirmModal.css';

const ResetPasswordModal = ({ student, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/users/${student._id}/reset-password`, {
        newPassword
      });
      
      toast.success(`Đã đặt lại mật khẩu cho ${student.name}`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Đặt lại mật khẩu</h3>
        <p>Sinh viên: <strong>{student.name}</strong> ({student.email})</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label>Mật khẩu mới:</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              required
              autoFocus
            />
            <small style={{ color: '#666', display: 'block', marginTop: 4 }}>
              Mật khẩu phải có ít nhất 6 ký tự
            </small>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
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

export default ResetPasswordModal;
