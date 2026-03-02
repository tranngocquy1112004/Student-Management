import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyLeaveRequests } from '../services/leaveService';
import toast from 'react-hot-toast';
import './Table.css';

const StudentLeaveStatus = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await getMyLeaveRequests();
      setRequests(response.data || []);
      setIsDismissed(false);
    } catch (error) {
      // Check if user is dismissed
      if (error.response?.status === 403) {
        const code = error.response?.data?.code;
        const message = error.response?.data?.message || '';
        
        if (code === 'ACCOUNT_DISMISSED' || message.includes('đuổi học') || message.includes('dismissed')) {
          setIsDismissed(true);
        } else {
          toast.error('Lỗi khi tải danh sách đơn xin bảo lưu');
        }
      } else {
        toast.error('Lỗi khi tải danh sách đơn xin bảo lưu');
      }
    } finally {
      setLoading(false);
    }
  };

  const translateReason = (reason) => {
    const translations = {
      voluntary: 'Tự nguyện',
      medical: 'Y tế',
      military: 'Nghĩa vụ quân sự',
      financial: 'Tài chính',
      personal: 'Cá nhân'
    };
    return translations[reason] || reason;
  };

  const translateStatus = (status) => {
    const translations = {
      pending: 'Đang chờ duyệt',
      approved: 'Đã phê duyệt',
      rejected: 'Đã từ chối'
    };
    return translations[status] || status;
  };

  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '500'
    };

    const statusStyles = {
      pending: {
        backgroundColor: '#fff3cd',
        color: '#856404',
        border: '1px solid #ffeaa7'
      },
      approved: {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb'
      },
      rejected: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        border: '1px solid #f5c6cb'
      }
    };

    return { ...baseStyle, ...statusStyles[status] };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const hasPendingRequest = requests.some(req => req.status === 'pending');

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Trạng thái đơn bảo lưu</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Đang tải...
        </div>
      </div>
    );
  }

  // If user is dismissed, show appropriate message
  if (isDismissed) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Trạng thái đơn bảo lưu</h1>
        </div>
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <h2 style={{ color: '#721c24', marginTop: 0 }}>
            🚫 Tài khoản của bạn đã bị đuổi học
          </h2>
          <p style={{ color: '#721c24', fontSize: '16px', marginBottom: '24px' }}>
            Bạn không thể truy cập trang bảo lưu.
            <br />
            Vui lòng xem quyết định đuổi học và gửi đơn khiếu nại nếu cần.
          </p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/student/expulsion')}
            style={{
              backgroundColor: '#dc3545',
              borderColor: '#dc3545'
            }}
          >
            Xem quyết định đuổi học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Trạng thái đơn bảo lưu</h1>
        {!hasPendingRequest && (
          <button 
            className="btn-primary" 
            onClick={() => navigate('/leave/request')}
          >
            + Nộp đơn xin bảo lưu
          </button>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="table-box" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
            Bạn chưa có đơn xin bảo lưu nào
          </p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/leave/request')}
          >
            Nộp đơn xin bảo lưu
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map((request) => (
            <div 
              key={request._id} 
              className="table-box"
              style={{ padding: '20px' }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{ margin: 0 }}>
                  Đơn xin bảo lưu - {translateReason(request.reason)}
                </h3>
                <span style={getStatusBadgeStyle(request.status)}>
                  {translateStatus(request.status)}
                </span>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div>
                  <strong>Ngày bắt đầu:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>{formatDate(request.startDate)}</p>
                </div>
                <div>
                  <strong>Ngày kết thúc:</strong>
                  <p style={{ margin: '4px 0 0 0' }}>{formatDate(request.endDate)}</p>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong>Chi tiết lý do:</strong>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {request.reasonText}
                </p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <strong>Ngày nộp đơn:</strong>
                <p style={{ margin: '4px 0 0 0' }}>{formatDate(request.createdAt)}</p>
              </div>

              {request.status !== 'pending' && (
                <>
                  <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <strong>Người xét duyệt:</strong>
                      <p style={{ margin: '4px 0 0 0' }}>
                        {request.reviewedBy?.name || '-'}
                      </p>
                    </div>
                    <div>
                      <strong>Ngày xét duyệt:</strong>
                      <p style={{ margin: '4px 0 0 0' }}>
                        {formatDate(request.reviewedAt)}
                      </p>
                    </div>
                  </div>

                  {request.reviewNote && (
                    <div>
                      <strong>
                        {request.status === 'rejected' ? 'Lý do từ chối:' : 'Ghi chú:'}
                      </strong>
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        padding: '12px',
                        backgroundColor: request.status === 'rejected' ? '#fff5f5' : '#f0f8ff',
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {request.reviewNote}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentLeaveStatus;
