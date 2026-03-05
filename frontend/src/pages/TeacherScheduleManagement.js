import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import './Table.css';

const TeacherScheduleManagement = () => {
  const { classId } = useParams();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    room: ''
  });

  useEffect(() => {
    fetchSchedules();
  }, [classId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/classes/${classId}/schedules`);
      setSchedules(data.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Không thể tải danh sách lịch học');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    
    if (formData.endTime <= formData.startTime) {
      toast.error('Giờ kết thúc phải sau giờ bắt đầu');
      return;
    }
    
    try {
      await api.post(`/classes/${classId}/schedules`, formData);
      toast.success('Đã tạo lịch học thành công');
      setShowForm(false);
      setFormData({ date: '', startTime: '', endTime: '', room: '' });
      fetchSchedules();
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể tạo lịch học';
      toast.error(message);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Bạn có chắc muốn xóa lịch học này?')) return;
    
    try {
      await api.delete(`/schedules/${scheduleId}`);
      toast.success('Đã xóa lịch học');
      fetchSchedules();
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể xóa lịch học';
      toast.error(message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: 'Sắp diễn ra', color: '#2196F3' },
      active: { text: 'Đang diễn ra', color: '#4CAF50' },
      expired: { text: 'Đã kết thúc', color: '#9E9E9E' }
    };
    const badge = badges[status] || badges.expired;
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        backgroundColor: badge.color,
        color: '#fff'
      }}>
        {badge.text}
      </span>
    );
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}>Đang tải...</div>;

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Quản lý lịch học</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Hủy' : '+ Tạo lịch học'}
        </button>
      </div>

      {showForm && (
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: 24, 
          borderRadius: 8, 
          marginBottom: 24 
        }}>
          <h3 style={{ marginTop: 0 }}>Tạo lịch học mới</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label>Ngày học *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label>Phòng học</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="Ví dụ: A101"
                />
              </div>
              <div>
                <label>Giờ bắt đầu *</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Giờ kết thúc *</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button type="submit" className="btn-primary">Tạo lịch học</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-box">
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Giờ học</th>
              <th>Phòng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {schedules.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: 48 }}>
                  Chưa có lịch học nào
                </td>
              </tr>
            ) : (
              schedules.map((schedule) => (
                <tr key={schedule._id}>
                  <td>{new Date(schedule.date).toLocaleDateString('vi-VN')}</td>
                  <td>{schedule.startTime} - {schedule.endTime}</td>
                  <td>{schedule.room || '-'}</td>
                  <td>{getStatusBadge(schedule.status)}</td>
                  <td>
                    {schedule.status === 'upcoming' && (
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(schedule._id)}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        Xóa
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherScheduleManagement;
