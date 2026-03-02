import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import './Table.css';

const StudentWarningsView = () => {
  const [warnings, setWarnings] = useState({ academicWarnings: [], attendanceWarnings: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarnings();
  }, []);

  const fetchWarnings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/students/warnings/me');
      setWarnings(response.data.data || { academicWarnings: [], attendanceWarnings: [] });
    } catch (error) {
      toast.error('Lỗi khi tải danh sách cảnh báo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  const hasWarnings = warnings.academicWarnings.length > 0 || warnings.attendanceWarnings.length > 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Cảnh Báo Của Tôi</h1>
      </div>

      {!hasWarnings ? (
        <div className="alert alert-success">
          Bạn không có cảnh báo nào. Hãy tiếp tục duy trì kết quả học tập tốt!
        </div>
      ) : (
        <>
          {warnings.academicWarnings.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2>Cảnh Báo Học Tập</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mức độ</th>
                    <th>Điểm TB</th>
                    <th>Ngưỡng</th>
                    <th>Học kỳ</th>
                    <th>Ngày cảnh báo</th>
                  </tr>
                </thead>
                <tbody>
                  {warnings.academicWarnings.map((w) => (
                    <tr key={w._id} className={w.warningLevel === 3 ? 'row-danger' : ''}>
                      <td>
                        <span className={`badge badge-${w.warningLevel === 3 ? 'danger' : w.warningLevel === 2 ? 'warning' : 'info'}`}>
                          Cảnh báo lần {w.warningLevel}
                        </span>
                      </td>
                      <td style={{ color: '#d32f2f', fontWeight: 'bold' }}>{w.gpa.toFixed(2)}</td>
                      <td>{w.threshold.toFixed(2)}</td>
                      <td>{w.semester}</td>
                      <td>{new Date(w.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {warnings.academicWarnings.some(w => w.warningLevel === 3) && (
                <div className="alert alert-danger" style={{ marginTop: '10px' }}>
                  ⚠️ Bạn đã nhận cảnh báo lần 3. Nếu không cải thiện điểm trong học kỳ tiếp theo, bạn có nguy cơ bị đuổi học.
                </div>
              )}
            </div>
          )}

          {warnings.attendanceWarnings.length > 0 && (
            <div>
              <h2>Cảnh Báo Vắng Học</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Lớp học</th>
                    <th>Tỷ lệ vắng</th>
                    <th>Số buổi vắng</th>
                    <th>Tổng số buổi</th>
                    <th>Mức độ</th>
                    <th>Ngày cảnh báo</th>
                  </tr>
                </thead>
                <tbody>
                  {warnings.attendanceWarnings.map((w) => (
                    <tr key={w._id} className={w.warningLevel === 'critical' ? 'row-danger' : ''}>
                      <td>{w.classId?.name}</td>
                      <td style={{ color: w.warningLevel === 'critical' ? '#d32f2f' : '#ff9800', fontWeight: 'bold' }}>
                        {w.absenceRate.toFixed(1)}%
                      </td>
                      <td>{w.absentSessions}</td>
                      <td>{w.totalSessions}</td>
                      <td>
                        <span className={`badge badge-${w.warningLevel === 'critical' ? 'danger' : 'warning'}`}>
                          {w.warningLevel === 'critical' ? 'Nghiêm trọng' : 'Cảnh báo'}
                        </span>
                      </td>
                      <td>{new Date(w.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {warnings.attendanceWarnings.some(w => w.warningLevel === 'critical') && (
                <div className="alert alert-danger" style={{ marginTop: '10px' }}>
                  ⚠️ Tỷ lệ vắng học của bạn đã vượt quá 30%. Bạn có nguy cơ bị đuổi học nếu tiếp tục vắng.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentWarningsView;
