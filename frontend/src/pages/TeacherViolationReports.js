import React, { useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import './Table.css';

const TeacherViolationReports = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({ studentId: '', description: '' });

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/admin/users?role=student&status=active');
      setStudents(response.data.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.description || formData.description.length < 20) {
      toast.error('Vui lòng điền đầy đủ thông tin (mô tả tối thiểu 20 ký tự)');
      return;
    }

    try {
      await axios.post('/teachers/violations', formData);
      toast.success('Báo cáo vi phạm đã được gửi thành công');
      setShowReportModal(false);
      setFormData({ studentId: '', description: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi gửi báo cáo');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Báo Cáo Vi Phạm</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => { fetchStudents(); setShowReportModal(true); }}
        >
          + Báo Cáo Vi Phạm
        </button>
      </div>

      <div className="alert alert-info">
        Sử dụng tính năng này để báo cáo các vi phạm kỷ luật nghiêm trọng của sinh viên. 
        Admin sẽ xem xét và có thể chuyển thành quyết định đuổi học.
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2>Báo Cáo Vi Phạm Kỷ Luật</h2>
            <form onSubmit={handleSubmitReport}>
              <div className="form-group">
                <label>Sinh viên *</label>
                <select 
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  className="form-control"
                  required
                >
                  <option value="">Chọn sinh viên</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} - {s.studentCode}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Mô tả vi phạm * (tối thiểu 20 ký tự)</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-control"
                  rows="6"
                  required
                  minLength={20}
                  maxLength={2000}
                  placeholder="Mô tả chi tiết hành vi vi phạm..."
                />
                <small>{formData.description.length} / 2000 ký tự</small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-danger">
                  Gửi Báo Cáo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherViolationReports;
