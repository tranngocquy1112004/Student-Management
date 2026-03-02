import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import './Table.css';

const StudentExpulsionView = () => {
  const [expulsion, setExpulsion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');

  useEffect(() => {
    fetchExpulsion();
  }, []);

  const fetchExpulsion = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/students/expulsions/me');
      setExpulsion(response.data.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setExpulsion(null);
      } else {
        toast.error('Lỗi khi tải thông tin đuổi học');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    
    if (!appealReason || appealReason.trim().length < 20) {
      toast.error('Lý do khiếu nại phải có ít nhất 20 ký tự');
      return;
    }

    try {
      await axios.put(`/students/expulsions/${expulsion._id}/appeal`, { appealReason });
      toast.success('Đơn khiếu nại đã được gửi thành công');
      setShowAppealModal(false);
      setAppealReason('');
      fetchExpulsion();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi gửi đơn khiếu nại');
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

  const translateAppealStatus = (status) => {
    const map = {
      none: 'Chưa khiếu nại',
      pending: 'Đang chờ xét duyệt',
      approved: 'Đã chấp nhận',
      rejected: 'Đã từ chối'
    };
    return map[status] || status;
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (!expulsion) {
    return (
      <div className="page-container">
        <div className="alert alert-info">
          Bạn không có quyết định đuổi học nào.
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Quyết Định Đuổi Học</h1>
      </div>

      <div className="card" style={{ padding: '20px', marginTop: '20px' }}>
        <div className="alert alert-danger">
          <h3>⚠️ Thông Báo Quyết Định Đuổi Học</h3>
          <p>Bạn đã bị đuổi học khỏi trường. Vui lòng đọc kỹ thông tin bên dưới.</p>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3>Thông tin quyết định</h3>
          <table className="info-table" style={{ width: '100%', marginTop: '10px' }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', width: '200px' }}>Loại vi phạm:</td>
                <td>{translateReasonType(expulsion.reasonType)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Lý do chi tiết:</td>
                <td>{expulsion.reason}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Ngày hiệu lực:</td>
                <td>{new Date(expulsion.effectiveDate).toLocaleDateString('vi-VN')}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>Người ra quyết định:</td>
                <td>{expulsion.createdBy?.name} ({expulsion.createdBy?.email})</td>
              </tr>
            </tbody>
          </table>
        </div>

        {expulsion.appealStatus === 'none' && (
          <div style={{ marginTop: '30px' }}>
            <div className="alert alert-warning">
              <h4>Quyền khiếu nại</h4>
              <p>Nếu bạn không đồng ý với quyết định này, bạn có quyền gửi đơn khiếu nại trong vòng 15 ngày kể từ ngày nhận được thông báo.</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAppealModal(true)}>
              Gửi Đơn Khiếu Nại
            </button>
          </div>
        )}

        {expulsion.appealStatus !== 'none' && (
          <div style={{ marginTop: '30px' }}>
            <h3>Thông tin khiếu nại</h3>
            <table className="info-table" style={{ width: '100%', marginTop: '10px' }}>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold', width: '200px' }}>Trạng thái:</td>
                  <td>
                    <span className={`badge badge-${expulsion.appealStatus === 'pending' ? 'warning' : expulsion.appealStatus === 'approved' ? 'success' : 'danger'}`}>
                      {translateAppealStatus(expulsion.appealStatus)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Lý do khiếu nại:</td>
                  <td>{expulsion.appealReason}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Ngày gửi:</td>
                  <td>{new Date(expulsion.appealSubmittedAt).toLocaleDateString('vi-VN')}</td>
                </tr>
                {expulsion.appealReviewNote && (
                  <tr>
                    <td style={{ fontWeight: 'bold' }}>Ghi chú xét duyệt:</td>
                    <td>{expulsion.appealReviewNote}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appeal Modal */}
      {showAppealModal && (
        <div className="modal-overlay" onClick={() => setShowAppealModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Gửi Đơn Khiếu Nại</h2>
            <form onSubmit={handleSubmitAppeal}>
              <div className="form-group">
                <label>Lý do khiếu nại * (tối thiểu 20 ký tự)</label>
                <textarea 
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="form-control"
                  rows="6"
                  required
                  minLength={20}
                  maxLength={2000}
                  placeholder="Nhập lý do khiếu nại của bạn..."
                />
                <small>{appealReason.length} / 2000 ký tự</small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAppealModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Gửi Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExpulsionView;
