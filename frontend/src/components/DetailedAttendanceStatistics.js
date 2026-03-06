import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './DetailedAttendanceStatistics.css';

const DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const DetailedAttendanceStatistics = ({ classId, refreshTrigger = 0 }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSessions, setExpandedSessions] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 5;

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!classId) {
        setError('Class ID is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await api.get(`/attendance/detailed-statistics/${classId}`);
        
        if (response.data.success) {
          setStatistics(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load statistics');
        }
      } catch (err) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('Không thể tải thống kê điểm danh. Vui lòng thử lại.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [classId, refreshTrigger]);

  const toggleSession = (sessionId) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
  };

  if (loading) {
    return (
      <div className="detailed-attendance-statistics">
        <div className="loading-message">Đang tải thống kê...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detailed-attendance-statistics">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!statistics || !statistics.sessions || statistics.sessions.length === 0) {
    return (
      <div className="detailed-attendance-statistics">
        <h3>Thống kê điểm danh chi tiết</h3>
        <p className="no-data">Chưa có dữ liệu điểm danh</p>
      </div>
    );
  }

  // Pagination
  const totalPages = Math.ceil(statistics.sessions.length / sessionsPerPage);
  const startIndex = (currentPage - 1) * sessionsPerPage;
  const endIndex = startIndex + sessionsPerPage;
  const currentSessions = statistics.sessions.slice(startIndex, endIndex);

  return (
    <div className="detailed-attendance-statistics">
      <h3>Thống kê điểm danh chi tiết - {statistics.className}</h3>
      <p className="total-students-info">Tổng số sinh viên: {statistics.totalStudents}</p>
      
      <div className="sessions-list">
        {currentSessions.map((session) => (
          <div key={session.sessionId} className="session-card">
            <div className="session-header" onClick={() => toggleSession(session.sessionId)}>
              <div className="session-info">
                <span className="session-day">{DAYS[session.dayOfWeek]}</span>
                <span className="session-date">{new Date(session.date).toLocaleDateString('vi-VN')}</span>
                <span className="session-time">{session.startTime} - {session.endTime}</span>
                <span className="session-room">Phòng: {session.room}</span>
              </div>
              <div className="session-stats">
                <span className="attended">{session.studentsAttended}/{session.totalStudents}</span>
                <span className={`rate ${session.attendanceRate >= 80 ? 'good' : session.attendanceRate >= 50 ? 'medium' : 'low'}`}>
                  {session.attendanceRate}%
                </span>
                <span className="expand-icon">{expandedSessions[session.sessionId] ? '▼' : '▶'}</span>
              </div>
            </div>
            
            {expandedSessions[session.sessionId] && (
              <div className="session-details">
                <div className="students-section">
                  <div className="attended-section">
                    <h4>Đã điểm danh ({session.studentsAttended})</h4>
                    {session.attendedStudents.length > 0 ? (
                      <ul className="students-list">
                        {session.attendedStudents.map((student) => (
                          <li key={student._id} className="student-item attended">
                            <span className="student-code">{student.studentCode}</span>
                            <span className="student-name">{student.name}</span>
                            <span className="check-time">
                              {new Date(student.checkedAt).toLocaleTimeString('vi-VN', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-students">Chưa có sinh viên điểm danh</p>
                    )}
                  </div>
                  
                  <div className="absent-section">
                    <h4>Chưa điểm danh ({session.studentsAbsent})</h4>
                    {session.absentStudents.length > 0 ? (
                      <ul className="students-list">
                        {session.absentStudents.map((student) => (
                          <li key={student._id} className="student-item absent">
                            <span className="student-code">{student.studentCode}</span>
                            <span className="student-name">{student.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-students">Tất cả sinh viên đã điểm danh</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ← Trước
          </button>
          <span>Trang {currentPage} / {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
};

export default DetailedAttendanceStatistics;
