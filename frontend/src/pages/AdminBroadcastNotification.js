import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import './Table.css';

const AdminBroadcastNotification = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    targetRoles: []
  });
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'admin', label: 'Admin', color: '#ef4444' },
    { value: 'teacher', label: 'Giảng viên', color: '#3b82f6' },
    { value: 'student', label: 'Sinh viên', color: '#10b981' }
  ];

  const handleRoleToggle = (role) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
    }));
  };

  const handleSelectAll = () => {
    if (formData.targetRoles.length === roles.length) {
      setFormData(prev => ({ ...prev, targetRoles: [] }));
    } else {
      setFormData(prev => ({ ...prev, targetRoles: roles.map(r => r.value) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Vui lòng nhập nội dung');
      return;
    }

    if (formData.targetRoles.length === 0) {
      toast.error('Vui lòng chọn ít nhất một đối tượng nhận');
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post('/notifications/broadcast', formData);
      toast.success(data.message || 'Đã gửi thông báo thành công');
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        targetRoles: []
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi thông báo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 8 }}>📢 Gửi Thông Báo Toàn Hệ Thống</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
          Gửi thông báo đến tất cả người dùng hoặc theo vai trò cụ thể
        </p>

        <form onSubmit={handleSubmit}>
          {/* Title Input */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              Tiêu đề <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nhập tiêu đề thông báo..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid var(--border-color)',
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          {/* Content Textarea */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 8, 
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              Nội dung <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Nhập nội dung thông báo..."
              rows={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid var(--border-color)',
                borderRadius: '10px',
                fontSize: '1rem',
                transition: 'all 0.2s ease',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
            <div style={{ 
              marginTop: 4, 
              fontSize: '0.85rem', 
              color: 'var(--text-tertiary)',
              textAlign: 'right'
            }}>
              {formData.content.length} ký tự
            </div>
          </div>

          {/* Target Roles */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 12
            }}>
              <label style={{ 
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                Đối tượng nhận <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                  e.target.style.color = 'var(--text-secondary)';
                }}
              >
                {formData.targetRoles.length === roles.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12
            }}>
              {roles.map(role => (
                <div
                  key={role.value}
                  onClick={() => handleRoleToggle(role.value)}
                  style={{
                    padding: '16px',
                    border: `2px solid ${formData.targetRoles.includes(role.value) ? role.color : 'var(--border-color)'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: formData.targetRoles.includes(role.value) 
                      ? `${role.color}15` 
                      : 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: '6px',
                    border: `2px solid ${formData.targetRoles.includes(role.value) ? role.color : 'var(--border-color)'}`,
                    background: formData.targetRoles.includes(role.value) ? role.color : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {formData.targetRoles.includes(role.value) && '✓'}
                  </div>
                  <div>
                    <div style={{ 
                      fontWeight: 600, 
                      color: formData.targetRoles.includes(role.value) ? role.color : 'var(--text-primary)'
                    }}>
                      {role.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {(formData.title || formData.content) && (
            <div style={{ 
              marginBottom: 24,
              padding: 20,
              background: 'var(--bg-tertiary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                color: 'var(--text-secondary)',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Xem trước
              </div>
              <div style={{
                padding: 16,
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                border: '2px solid rgba(79, 70, 229, 0.3)'
              }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: 'var(--text-primary)',
                  fontSize: '1.1rem'
                }}>
                  {formData.title || 'Tiêu đề thông báo'}
                </h4>
                <p style={{ 
                  margin: 0, 
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {formData.content || 'Nội dung thông báo sẽ hiển thị ở đây...'}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                background: loading 
                  ? 'var(--text-tertiary)' 
                  : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                color: 'white',
                border: 'none',
                padding: '14px 24px',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : '0 4px 6px rgba(79, 70, 229, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(79, 70, 229, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px rgba(79, 70, 229, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <span style={{ 
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Đang gửi...
                </>
              ) : (
                <>
                  📤 Gửi thông báo
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminBroadcastNotification;
