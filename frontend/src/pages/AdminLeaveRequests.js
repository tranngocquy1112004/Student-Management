import React, { useEffect, useState } from 'react';
import { 
  getPendingLeaveRequests, 
  approveLeaveRequest, 
  rejectLeaveRequest 
} from '../services/adminLeaveService';
import toast from 'react-hot-toast';
import './Table.css';

const AdminLeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    fetchRequests();
  }, [page]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getPendingLeaveRequests(page, 20);
      setRequests(response.data || []);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đơn xin bảo lưu');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setReviewNote('');
    setShowApproveModal(true);
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setReviewNote('');
    setShowRejectModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedRequest) return;

    setActionLoading(true);
    try {
      await approveLeaveRequest(selectedRequest._id, reviewNote);
      toast.success('Đã phê duyệt đơn xin bảo lưu');
      setShowApproveModal(false);
      setSelectedRequest(null);
      setReviewNote('');
      // Refresh the list
      await fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi phê duyệt đơn');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest) return;

    if (!reviewNote || reviewNote.trim().length === 0) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    setActionLoading(true);
    try {
      await rejectLeaveRequest(selectedRequest._id, reviewNote);
      toast.success('Đã từ chối đơn xin bảo lưu');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setReviewNote('');
      // Refresh the list
      await fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi từ chối đơn');
    } finally {
      setActionLoading(false);
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Quản lý đơn xin bảo lưu</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quản lý đơn xin bảo lưu</h1>
      </div>

      {requests.length === 0 ? (
        <div className="table-box" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>
            Không có đơn xin bảo lưu đang chờ duyệt
          </p>
        </div>
      ) : (
        <>
          <div className="table-box">
            <table>
              <thead>
                <tr>
                  <th>Mã SV</th>
                  <th>Họ tên</th>
                  <th>Lý do</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Ngày nộp</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id}>
                    <td>{request.studentId?.studentCode || '-'}</td>
                    <td>{request.studentId?.name || '-'}</td>
                    <td>{translateReason(request.reason)}</td>
                    <td>{formatDate(request.startDate)}</td>
                    <td>{formatDate(request.endDate)}</td>
                    <td>{formatDate(request.createdAt)}</td>
                    <td>
                      <button 
                        onClick={() => handleApproveClick(request)}
                        style={{ 
                          backgroundColor: '#28a745', 
                          color: 'white',
                          marginRight: '8px'
                        }}
                      >
                        Duyệt
                      </button>
                      <button 
                        onClick={() => handleRejectClick(request)}
                        className="btn-danger"
                      >
                        Từ chối
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '8px',
              marginTop: '20px'
            }}>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                style={{ padding: '8px 12px' }}
              >
                ← Trước
              </button>
              <span style={{ padding: '0 16px' }}>
                Trang {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
                style={{ padding: '8px 12px' }}
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowApproveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Phê duyệt đơn xin bảo lưu</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <p><strong>Sinh viên:</strong> {selectedRequest.studentId?.name}</p>
              <p><strong>Mã SV:</strong> {selectedRequest.studentId?.studentCode}</p>
              <p><strong>Lý do:</strong> {translateReason(selectedRequest.reason)}</p>
              <p><strong>Thời gian:</strong> {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong>Chi tiết lý do:</strong>
              <p style={{ 
                margin: '8px 0', 
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedRequest.reasonText}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Ghi chú (tùy chọn):</label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Nhập ghi chú nếu cần"
                rows={3}
                style={{ width: '100%', padding: '8px' }}
                disabled={actionLoading}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={handleApproveConfirm}
                className="btn-primary"
                disabled={actionLoading}
                style={{ backgroundColor: '#28a745' }}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
              </button>
              <button 
                onClick={() => setShowApproveModal(false)}
                disabled={actionLoading}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowRejectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Từ chối đơn xin bảo lưu</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <p><strong>Sinh viên:</strong> {selectedRequest.studentId?.name}</p>
              <p><strong>Mã SV:</strong> {selectedRequest.studentId?.studentCode}</p>
              <p><strong>Lý do:</strong> {translateReason(selectedRequest.reason)}</p>
              <p><strong>Thời gian:</strong> {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong>Chi tiết lý do:</strong>
              <p style={{ 
                margin: '8px 0', 
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedRequest.reasonText}
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>
                Lý do từ chối: <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Nhập lý do từ chối (bắt buộc)"
                rows={4}
                style={{ 
                  width: '100%', 
                  padding: '8px',
                  border: reviewNote.trim().length === 0 ? '1px solid red' : '1px solid #ccc'
                }}
                disabled={actionLoading}
                required
              />
              {reviewNote.trim().length === 0 && (
                <small style={{ color: 'red' }}>
                  Vui lòng nhập lý do từ chối
                </small>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={handleRejectConfirm}
                className="btn-danger"
                disabled={actionLoading || reviewNote.trim().length === 0}
              >
                {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
              <button 
                onClick={() => setShowRejectModal(false)}
                disabled={actionLoading}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaveRequests;
