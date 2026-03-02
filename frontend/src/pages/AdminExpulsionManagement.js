import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import './Table.css';

const AdminExpulsionManagement = () => {
  const [expulsions, setExpulsions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedExpulsion, setSelectedExpulsion] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({ status: '', reasonType: '' });

  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    reason: '',
    reasonType: '',
    effectiveDate: '',
    notes: ''
  });
  const [students, setStudents] = useState([]);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
    fetchExpulsions();
  }, [page, filters]);

  useEffect(() => {
    if (showCreateModal) {
      fetchStudents();
    }
  }, [showCreateModal]);

  const fetchExpulsions = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20, ...filters };
      const response = await axios.get('/admin/expulsions', { params });
      setExpulsions(response.data.data || []);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đuổi học');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/admin/users?role=student&status=active');
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCreateExpulsion = async (e) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.reason || !formData.reasonType || !formData.effectiveDate) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Validate effectiveDate is not in the past
    const selectedDate = new Date(formData.effectiveDate);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error('Ngày hiệu lực phải là hôm nay hoặc trong tương lai');
      return;
    }

    try {
      await axios.post('/admin/expulsions', formData);
      toast.success('Quyết định đuổi học đã được tạo thành công');
      setShowCreateModal(false);
      setFormData({ studentId: '', reason: '', reasonType: '', effectiveDate: '', notes: '' });
      fetchExpulsions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo quyết định đuổi học');
    }
  };

  const handleViewDetails = async (expulsion) => {
    try {
      const response = await axios.get(`/admin/expulsions/${expulsion._id}`);
      setSelectedExpulsion(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Lỗi khi tải chi tiết');
    }
  };

  const handleApproveAppeal = async () => {
    if (!selectedExpulsion) return;
    
    try {
      await axios.put(`/admin/expulsions/${selectedExpulsion._id}/approve-appeal`, { reviewNote });
      toast.success('Đơn khiếu nại đã được chấp nhận');
      setShowAppealModal(false);
      setReviewNote('');
      fetchExpulsions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi chấp nhận đơn khiếu nại');
    }
  };

  const handleRejectAppeal = async () => {
    if (!selectedExpulsion || !reviewNote) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    
    try {
      await axios.put(`/admin/expulsions/${selectedExpulsion._id}/reject-appeal`, { reviewNote });
      toast.success('Đơn khiếu nại đã bị từ chối');
      setShowAppealModal(false);
      setReviewNote('');
      fetchExpulsions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi từ chối đơn khiếu nại');
    }
  };

  const translateReasonType = (type) => {
    const map = {
      low_gpa: 'Điểm trung bình thấp',
      discipline_violation: 'Vi phạm kỷ luật',
      excessive_absence: 'Vắng học quá nhiều',
      expired_leave: 'Hết hạn bảo lưu'
    };
    return map[type] || type;
  };

  const translateStatus = (status) => {
    const map = {
      pending: 'Chờ xử lý',
      active: 'Đang hiệu lực',
      appealed: 'Đang khiếu nại',
      revoked: 'Đã hủy'
    };
    return map[status] || status;
  };

  const translateAppealStatus = (status) => {
    const map = {
      none: 'Chưa khiếu nại',
      pending: 'Chờ xét duyệt',
      approved: 'Đã chấp nhận',
      rejected: 'Đã từ chối'
    };
    return map[status] || status;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Quản Lý Đuổi Học</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Tạo Quyết Định Đuổi Học
        </button>
      </div>

      {/* Filters */}
      <div className="filters" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <select 
          value={filters.status} 
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="form-control"
          style={{ width: '200px' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hiệu lực</option>
          <option value="appealed">Đang khiếu nại</option>
          <option value="revoked">Đã hủy</option>
        </select>

        <select 
          value={filters.reasonType} 
          onChange={(e) => setFilters({...filters, reasonType: e.target.value})}
          className="form-control"
          style={{ width: '200px' }}
        >
          <option value="">Tất cả loại vi phạm</option>
          <option value="low_gpa">Điểm trung bình thấp</option>
          <option value="discipline_violation">Vi phạm kỷ luật</option>
          <option value="excessive_absence">Vắng học quá nhiều</option>
          <option value="expired_leave">Hết hạn bảo lưu</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Sinh viên</th>
                <th>Loại vi phạm</th>
                <th>Ngày hiệu lực</th>
                <th>Trạng thái</th>
                <th>Khiếu nại</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {expulsions.map((exp) => (
                <tr key={exp._id}>
                  <td>
                    <div>{exp.studentId?.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{exp.studentId?.studentCode}</div>
                  </td>
                  <td>{translateReasonType(exp.reasonType)}</td>
                  <td>{new Date(exp.effectiveDate).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <span className={`badge badge-${exp.status === 'active' ? 'danger' : exp.status === 'revoked' ? 'success' : 'warning'}`}>
                      {translateStatus(exp.status)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${exp.appealStatus === 'pending' ? 'warning' : exp.appealStatus === 'approved' ? 'success' : 'secondary'}`}>
                      {translateAppealStatus(exp.appealStatus)}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-info" onClick={() => handleViewDetails(exp)}>
                      Chi tiết
                    </button>
                    {exp.appealStatus === 'pending' && (
                      <button 
                        className="btn btn-sm btn-warning" 
                        onClick={() => { setSelectedExpulsion(exp); setShowAppealModal(true); }}
                        style={{ marginLeft: '5px' }}
                      >
                        Xét khiếu nại
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="btn btn-sm"
            >
              Trước
            </button>
            <span>Trang {pagination.page} / {pagination.totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} 
              disabled={page === pagination.totalPages}
              className="btn btn-sm"
            >
              Sau
            </button>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Tạo Quyết Định Đuổi Học</h2>
            <form onSubmit={handleCreateExpulsion}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Sinh viên *</label>
                <select 
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  className="form-control"
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Chọn sinh viên</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} - {s.studentCode}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Loại vi phạm *</label>
                <select 
                  value={formData.reasonType}
                  onChange={(e) => setFormData({...formData, reasonType: e.target.value})}
                  className="form-control"
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Chọn loại vi phạm</option>
                  <option value="low_gpa">Điểm trung bình thấp</option>
                  <option value="discipline_violation">Vi phạm kỷ luật</option>
                  <option value="excessive_absence">Vắng học quá nhiều</option>
                  <option value="expired_leave">Hết hạn bảo lưu</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Lý do chi tiết * (tối thiểu 20 ký tự)</label>
                <textarea 
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="form-control"
                  rows="4"
                  required
                  minLength={20}
                  maxLength={2000}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                  placeholder="Nhập lý do chi tiết (tối thiểu 20 ký tự)"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>{formData.reason.length}/2000 ký tự</small>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Ngày hiệu lực *</label>
                <input 
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
                  className="form-control"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Ghi chú (tùy chọn)</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="form-control"
                  rows="2"
                  maxLength={1000}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                  placeholder="Nhập ghi chú bổ sung (nếu có)"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>{formData.notes.length}/1000 ký tự</small>
              </div>

              <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-danger">
                  Tạo Quyết Định
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedExpulsion && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <h2>Chi Tiết Quyết Định Đuổi Học</h2>
            <div style={{ marginTop: '20px' }}>
              <p><strong>Sinh viên:</strong> {selectedExpulsion.studentId?.name} ({selectedExpulsion.studentId?.studentCode})</p>
              <p><strong>Loại vi phạm:</strong> {translateReasonType(selectedExpulsion.reasonType)}</p>
              <p><strong>Lý do:</strong> {selectedExpulsion.reason}</p>
              <p><strong>Ngày hiệu lực:</strong> {new Date(selectedExpulsion.effectiveDate).toLocaleDateString('vi-VN')}</p>
              <p><strong>Trạng thái:</strong> {translateStatus(selectedExpulsion.status)}</p>
              <p><strong>Trạng thái khiếu nại:</strong> {translateAppealStatus(selectedExpulsion.appealStatus)}</p>
              
              {selectedExpulsion.appealReason && (
                <>
                  <hr />
                  <h3>Thông tin khiếu nại</h3>
                  <p><strong>Lý do khiếu nại:</strong> {selectedExpulsion.appealReason}</p>
                  <p><strong>Ngày gửi:</strong> {new Date(selectedExpulsion.appealSubmittedAt).toLocaleDateString('vi-VN')}</p>
                  {selectedExpulsion.appealReviewNote && (
                    <p><strong>Ghi chú xét duyệt:</strong> {selectedExpulsion.appealReviewNote}</p>
                  )}
                </>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appeal Review Modal */}
      {showAppealModal && selectedExpulsion && (
        <div className="modal-overlay" onClick={() => setShowAppealModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Xét Duyệt Khiếu Nại</h2>
            <div style={{ marginTop: '20px' }}>
              <p><strong>Sinh viên:</strong> {selectedExpulsion.studentId?.name}</p>
              <p><strong>Lý do khiếu nại:</strong> {selectedExpulsion.appealReason}</p>
              
              <div className="form-group" style={{ marginTop: '20px' }}>
                <label>Ghi chú xét duyệt</label>
                <textarea 
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="form-control"
                  rows="3"
                  placeholder="Nhập ghi chú (bắt buộc nếu từ chối)"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAppealModal(false)}>
                Hủy
              </button>
              <button className="btn btn-danger" onClick={handleRejectAppeal}>
                Từ chối
              </button>
              <button className="btn btn-success" onClick={handleApproveAppeal}>
                Chấp nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpulsionManagement;
