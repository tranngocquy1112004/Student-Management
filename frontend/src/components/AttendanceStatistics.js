import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AttendanceStatistics.css';

/**
 * AttendanceStatistics Component
 * Displays attendance statistics table for teacher
 * @param {string} classId - The class ID to get statistics for
 * @param {number} refreshTrigger - Optional trigger to refresh data
 */
const AttendanceStatistics = ({ classId, refreshTrigger = 0 }) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        const response = await api.get(`/attendance/statistics/${classId}`);
        
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

  if (loading) {
    return (
      <div className="attendance-statistics">
        <div className="loading-message">Đang tải thống kê...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-statistics">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <div className="attendance-statistics">
      <h3>Thống kê điểm danh hôm nay</h3>
      <table className="statistics-table">
        <thead>
          <tr>
            <th>Tên lớp</th>
            <th>Tổng số sinh viên</th>
            <th>Sinh viên đã điểm danh</th>
            <th>Tỷ lệ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{statistics.className}</td>
            <td>{statistics.totalStudents}</td>
            <td>{statistics.studentsAttended}</td>
            <td>
              {statistics.totalStudents > 0
                ? `${Math.round((statistics.studentsAttended / statistics.totalStudents) * 100)}%`
                : '0%'}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceStatistics;
