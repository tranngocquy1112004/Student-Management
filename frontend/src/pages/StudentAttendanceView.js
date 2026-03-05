import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import './Table.css';

const StudentAttendanceView = () => {
  const { classId } = useParams();
  const [schedules, setSchedules] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    fetchData();
    // Refresh status every 30 seconds for real-time updates
    const interval = setInterval(fetchAttendanceStatus, 30000);
    return () => clearInterval(interval);
  }, [classId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchSchedules(), fetchAttendanceStatus()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const { data } = await api.get(`/classes/${classId}/schedules`);
      setSchedules(data.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      const { data } = await api.get(`/classes/${classId}/attendance/status`);
      setAttendanceStatus(data.data || {});
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    }
  };

  const handleCheckIn = async () => {
    if (checkingIn) return;
    
    setCheckingIn(true);
    try {
      await api.post(`/classes/${classId}/attendance/check-in`);
      toast.success('Điểm danh thành công!');
      await fetchData(); // Refresh data
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể điểm danh';
      toast.error(message);
    } finally {
      setCheckingIn(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: 'Chưa đến giờ', color: '#2196F3' },
      active: { text: 'Có thể điểm danh', color: '#4CAF50' },
      expired: { text: 'Đã quá hạn', color: '#9E9E9E' }
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

  const canCheckIn = (schedule) => {
    return schedule.status === 'active' && !attendanceStatus.hasCheckedIn;
  };

  const hasCheckedIn = (schedule) => {
    // Check if this is today's session and student has checked in
    const today = new Date().toDateString();
    const scheduleDate = new Date(schedule.date).toDateString();
    return scheduleDate === today && attendanceStatus.hasCheckedIn;
  };

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}>Đang tải...</div>;

  return (
    <div className="page">
      <h1>Lịch học và điểm danh</h1>

      {attendanceStatus.hasSession && attendanceStatus.sessionStatus === 'active' && (
        <div style={{
          backgroundColor: attendanceStatus.hasCheckedIn ? '#e8f5e9' : '#fff3e0',
          padding: 24,
          borderRadius: 8,
          marginBottom: 24,
          border: `2px solid ${attendanceStatus.hasCheckedIn ? '#4CAF50' : '#FF9800'}`
        }}>
          <h3 style={{ marginTop: 0 }}>
            {attendanceStatus.hasCheckedIn ? '✓ Đã điểm danh' : '⚠️ Chưa điểm danh'}
          </h3>
          <p style={{ margin: '8px 0' }}>
            Buổi học hôm nay: {attendanceStatus.session?.startTime} - {attendanceStatus.session?.endTime}
          </p>
          {!attendanceStatus.hasCheckedIn && (
            <button
              className="btn-primary"
              onClick={handleCheckIn}
              disabled={checkingIn}
              style={{ marginTop: 8 }}
            >
              {checkingIn ? 'Đang xử lý...' : 'Điểm danh ngay'}
            </button>
          )}
          {attendanceStatus.hasCheckedIn && attendanceStatus.checkInTime && (
            <p style={{ margin: '8px 0', fontSize: '14px', color: '#666' }}>
              Thời gian điểm danh: {new Date(attendanceStatus.checkInTime).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
      )}

      <div className="table-box">
        <h3>Danh sách lịch học</h3>
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Giờ học</th>
              <th>Phòng</th>
              <th>Trạng thái</th>
              <th>Điểm danh</th>
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
                    {hasCheckedIn(schedule) ? (
                      <span style={{ color: '#4CAF50', fontWeight: '500' }}>✓ Đã điểm danh</span>
                    ) : canCheckIn(schedule) ? (
                      <button
                        className="btn-primary"
                        onClick={handleCheckIn}
                        disabled={checkingIn}
                        style={{ fontSize: '12px', padding: '4px 12px' }}
                      >
                        Điểm danh
                      </button>
                    ) : schedule.status === 'expired' ? (
                      <span style={{ color: '#9E9E9E' }}>Đã quá hạn</span>
                    ) : (
                      <span style={{ color: '#2196F3' }}>Chưa đến giờ</span>
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

export default StudentAttendanceView;
