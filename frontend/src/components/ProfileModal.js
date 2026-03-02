import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import './ConfirmModal.css';

const ProfileModal = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    studentCode: '',
    teacherCode: '',
    avatar: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setProfile({
        name: data.data.name || '',
        email: data.data.email || '',
        phone: data.data.phone || '',
        studentCode: data.data.studentCode || '',
        teacherCode: data.data.teacherCode || '',
        avatar: data.data.avatar || ''
      });
    } catch (error) {
      toast.error('Lỗi khi tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/auth/me', {
        name: profile.name,
        phone: profile.phone
      });

      // Update localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.name = profile.name;
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Cập nhật thông tin thành công');
      onClose();
      window.location.reload(); // Reload to update header
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const { data } = await api.put('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update profile state
      setProfile({ ...profile, avatar: data.data.avatar });

      // Update localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.avatar = data.data.avatar;
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const avatarUrl = profile.avatar 
    ? (profile.avatar.startsWith('http') 
        ? profile.avatar 
        : (process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000') + profile.avatar)
    : null;

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h3>Đang tải...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <h3>Thông tin cá nhân</h3>
        
        {/* Avatar Upload Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative' }}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                style={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '3px solid #1976d2'
                }} 
              />
            ) : (
              <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                backgroundColor: '#e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                border: '3px solid #1976d2'
              }}>
                👤
              </div>
            )}
            {uploadingAvatar && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                Đang tải...
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            {uploadingAvatar ? 'Đang tải...' : '📷 Thay đổi ảnh đại diện'}
          </button>
          <small style={{ color: '#666', marginTop: 8, textAlign: 'center' }}>
            Chọn ảnh JPG, PNG hoặc GIF (tối đa 5MB)
          </small>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label>Họ tên:</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Email:</label>
            <input
              type="email"
              value={profile.email}
              disabled
              style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
            />
            <small style={{ color: '#666', display: 'block', marginTop: 4 }}>
              Email không thể thay đổi
            </small>
          </div>

          {profile.studentCode && (
            <div style={{ marginBottom: 16 }}>
              <label>Mã sinh viên:</label>
              <input
                type="text"
                value={profile.studentCode}
                disabled
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>
          )}

          {profile.teacherCode && (
            <div style={{ marginBottom: 16 }}>
              <label>Mã giảng viên:</label>
              <input
                type="text"
                value={profile.teacherCode}
                disabled
                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label>Số điện thoại:</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
