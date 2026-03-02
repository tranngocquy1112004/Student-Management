import React, { useState } from 'react';
import { submitLeaveRequest } from '../services/leaveService';
import toast from 'react-hot-toast';
import './ConfirmModal.css';

const LeaveRequestForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    reason: '',
    reasonText: '',
    startDate: '',
    endDate: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const reasonOptions = [
    { value: 'voluntary', label: 'Tự nguyện' },
    { value: 'medical', label: 'Y tế' },
    { value: 'military', label: 'Nghĩa vụ quân sự' },
    { value: 'financial', label: 'Tài chính' },
    { value: 'personal', label: 'Cá nhân' }
  ];

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate reason
    if (!formData.reason) {
      newErrors.reason = 'Vui lòng chọn lý do bảo lưu';
    }

    // Validate reasonText
    if (!formData.reasonText) {
      newErrors.reasonText = 'Vui lòng nhập chi tiết lý do';
    } else if (formData.reasonText.length < 20) {
      newErrors.reasonText = 'Chi tiết lý do phải có ít nhất 20 ký tự';
    } else if (formData.reasonText.length > 1000) {
      newErrors.reasonText = 'Chi tiết lý do không được vượt quá 1000 ký tự';
    }

    // Validate startDate
    if (!formData.startDate) {
      newErrors.startDate = 'Vui lòng chọn ngày bắt đầu';
    } else {
      const startDate = new Date(formData.startDate);
      startDate.setHours(0, 0, 0, 0);
      if (startDate < today) {
        newErrors.startDate = 'Ngày bắt đầu không thể là quá khứ';
      }
    }

    // Validate endDate
    if (!formData.endDate) {
      newErrors.endDate = 'Vui lòng chọn ngày kết thúc';
    } else if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await submitLeaveRequest(formData);
      toast.success('Đơn xin bảo lưu đã được gửi thành công');
      // Clear form
      setFormData({
        reason: '',
        reasonText: '',
        startDate: '',
        endDate: ''
      });
      setErrors({});
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi gửi đơn xin bảo lưu';
      toast.error(errorMessage);
      // If there are field-specific errors from API
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label>Lý do bảo lưu: <span style={{ color: 'red' }}>*</span></label>
          <select
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px',
              border: errors.reason ? '1px solid red' : '1px solid #ccc'
            }}
          >
            <option value="">-- Chọn lý do --</option>
            {reasonOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.reason && (
            <small style={{ color: 'red', display: 'block', marginTop: 4 }}>
              {errors.reason}
            </small>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Chi tiết lý do: <span style={{ color: 'red' }}>*</span></label>
          <textarea
            name="reasonText"
            value={formData.reasonText}
            onChange={handleChange}
            placeholder="Nhập chi tiết lý do bảo lưu (tối thiểu 20 ký tự)"
            rows={5}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px',
              border: errors.reasonText ? '1px solid red' : '1px solid #ccc',
              resize: 'vertical'
            }}
          />
          <small style={{ color: '#666', display: 'block', marginTop: 4 }}>
            {formData.reasonText.length}/1000 ký tự
          </small>
          {errors.reasonText && (
            <small style={{ color: 'red', display: 'block', marginTop: 4 }}>
              {errors.reasonText}
            </small>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Ngày bắt đầu: <span style={{ color: 'red' }}>*</span></label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            min={getTodayDate()}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px',
              border: errors.startDate ? '1px solid red' : '1px solid #ccc'
            }}
          />
          {errors.startDate && (
            <small style={{ color: 'red', display: 'block', marginTop: 4 }}>
              {errors.startDate}
            </small>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label>Ngày kết thúc: <span style={{ color: 'red' }}>*</span></label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate || getTodayDate()}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px',
              border: errors.endDate ? '1px solid red' : '1px solid #ccc'
            }}
          />
          {errors.endDate && (
            <small style={{ color: 'red', display: 'block', marginTop: 4 }}>
              {errors.endDate}
            </small>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? 'Đang gửi...' : 'Gửi đơn'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveRequestForm;
