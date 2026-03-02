import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../api/axios';
import AttendanceRateChart from '../components/AttendanceRateChart';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/dashboard/admin').then(({ data: res }) => setData(res.data)); }, []);
  if (!data) return <div>Đang tải...</div>;
  const roleData = data.usersByRole || {};
  const statusData = data.classesByStatus || {};
  const gradeData = data.gradeDistribution || { gioi: 0, kha: 0, trungBinh: 0, yeu: 0 };
  return (
    <div className="dashboard">
      <h1>Dashboard Admin</h1>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-num">{data.totalUsers}</span><span>User</span></div>
        <div className="stat-card"><span className="stat-num">{data.totalClasses}</span><span>Lớp</span></div>
        <div className="stat-card"><span className="stat-num">{data.totalSubjects}</span><span>Môn học</span></div>
        <div className="stat-card"><span className="stat-num">{data.totalFaculties}</span><span>Khoa</span></div>
      </div>
      <div className="charts-row">
        <div className="chart-box">
          <h3>User theo role</h3>
          <Doughnut data={{
            labels: ['Admin', 'Teacher', 'Student'],
            datasets: [{ data: [roleData.admin || 0, roleData.teacher || 0, roleData.student || 0], backgroundColor: ['#1a237e', '#0d47a1', '#1976d2'] }],
          }} options={{ responsive: true }} />
        </div>
        <div className="chart-box">
          <h3>Lớp theo trạng thái</h3>
          <Bar data={{
            labels: ['active', 'closed', 'upcoming'],
            datasets: [{ label: 'Số lớp', data: [statusData.active || 0, statusData.closed || 0, statusData.upcoming || 0], backgroundColor: '#1a237e' }],
          }} options={{ responsive: true }} />
        </div>
        <div className="chart-box">
          <h3>Sinh viên theo học lực</h3>
          <Doughnut data={{
            labels: ['Giỏi (8-10)', 'Khá (6.5-7.9)', 'Trung Bình (5-6.4)', 'Yếu (<5)'],
            datasets: [{ data: [gradeData.gioi || 0, gradeData.kha || 0, gradeData.trungBinh || 0, gradeData.yeu || 0], backgroundColor: ['#2e7d32', '#1976d2', '#ed6c02', '#c62828'] }],
          }} options={{ 
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 8,
                  font: { size: 9 },
                  boxWidth: 12,
                  padding: 6
                }
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export const TeacherDashboard = () => {
  const [data, setData] = useState(null);
  const [gradeData, setGradeData] = useState({ gioi: 0, kha: 0, trungBinh: 0, yeu: 0 });
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  
  // Fetch classes list
  useEffect(() => {
    api.get('/classes').then(({ data: res }) => {
      setClasses(res.data || []);
    }).catch(err => {
      console.error('Error fetching classes:', err);
    });
  }, []);
  
  // Fetch dashboard data based on selected class
  useEffect(() => { 
    const url = selectedClass === 'all' 
      ? '/dashboard/teacher' 
      : `/dashboard/teacher?classId=${selectedClass}`;
      
    api.get(url).then(({ data: res }) => {
      setData(res.data);
      setGradeData(res.data.gradeDistribution || { gioi: 0, kha: 0, trungBinh: 0, yeu: 0 });
      setAttendanceRate(res.data.attendRate || 0);
    }).catch(err => {
      console.error('Error fetching dashboard data:', err);
    }); 
  }, [selectedClass]);
  
  if (!data) return <div>Đang tải...</div>;
  
  return (
    <div className="dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Dashboard Giảng viên</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label htmlFor="classFilter" style={{ fontWeight: 'bold' }}>Lọc theo lớp:</label>
          <select 
            id="classFilter"
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="all">Tất cả lớp</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-num">{data.totalClasses}</span><span>Lớp dạy</span></div>
        <div className="stat-card"><span className="stat-num">{data.totalStudents}</span><span>Sinh viên</span></div>
        <div className="stat-card"><span className="stat-num">{data.assignmentsGraded}</span><span>Đã chấm</span></div>
        <div className="stat-card"><span className="stat-num">{data.assignmentsPending}</span><span>Chưa chấm</span></div>
        <div className="stat-card"><span className="stat-num">{data.attendRate}%</span><span>Tỷ lệ điểm danh</span></div>
      </div>
      
      {/* Attendance Rate Chart */}
      <AttendanceRateChart classId={selectedClass !== 'all' ? selectedClass : undefined} />
      
      <div className="charts-row">
        <div className="chart-box">
          <h3>Sinh viên theo học lực (từ Bảng điểm)</h3>
          <Doughnut data={{
            labels: ['Giỏi (8-10)', 'Khá (6.5-7.9)', 'Trung Bình (5-6.4)', 'Yếu (<5)'],
            datasets: [{ 
              data: [gradeData.gioi || 0, gradeData.kha || 0, gradeData.trungBinh || 0, gradeData.yeu || 0], 
              backgroundColor: ['#2e7d32', '#1976d2', '#ed6c02', '#c62828'], 
              borderWidth: 2, 
              borderColor: '#fff' 
            }],
          }} options={{ 
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 1000,
              easing: 'easeInOutQuart'
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 8,
                  font: { size: 9 },
                  boxWidth: 12,
                  padding: 6
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                    return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                  }
                }
              }
            }
          }} />
        </div>
        <div className="chart-box">
          <h3>Tỷ lệ điểm danh</h3>
          <Doughnut data={{
            labels: ['Đã điểm danh', 'Chưa điểm danh'],
            datasets: [{ 
              data: [attendanceRate, 100 - attendanceRate], 
              backgroundColor: ['#2e7d32', '#e0e0e0'],
              borderWidth: 2,
              borderColor: ['#fff', '#fff']
            }],
          }} options={{ 
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 1000,
              easing: 'easeInOutQuart'
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 8,
                  font: { size: 9 },
                  boxWidth: 12,
                  padding: 6
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.label + ': ' + context.parsed + '%';
                  }
                }
              }
            }
          }} />
        </div>
      </div>
    </div>
  );
};

export const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [restrictedStatus, setRestrictedStatus] = useState(null); // 'on_leave' or 'dismissed'
  
  useEffect(() => { 
    api.get('/dashboard/student')
      .then(({ data: res }) => {
        setData(res.data);
        setRestrictedStatus(null);
      })
      .catch((error) => {
        if (error.response?.status === 403) {
          // Check error code or message to determine if on_leave or dismissed
          const code = error.response?.data?.code;
          const message = error.response?.data?.message || '';
          
          if (code === 'ACCOUNT_DISMISSED' || message.includes('đuổi học') || message.includes('dismissed')) {
            setRestrictedStatus('dismissed');
          } else {
            setRestrictedStatus('on_leave');
          }
        }
      });
  }, []);
  
  // Sinh viên bị đuổi học
  if (restrictedStatus === 'dismissed') {
    return (
      <div className="dashboard">
        <h1>Dashboard Học sinh</h1>
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          marginTop: '40px'
        }}>
          <h2 style={{ color: '#721c24', marginTop: 0 }}>
            🚫 Tài khoản của bạn đã bị đuổi học
          </h2>
          <p style={{ color: '#721c24', fontSize: '16px', marginBottom: '24px' }}>
            Bạn không thể truy cập các lớp học và bài tập.
            <br />
            Vui lòng xem quyết định đuổi học và gửi đơn khiếu nại nếu cần.
          </p>
          <Link 
            to="/student/expulsion" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#dc3545',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: '500',
              fontSize: '16px'
            }}
          >
            Xem quyết định đuổi học
          </Link>
        </div>
      </div>
    );
  }
  
  // Sinh viên đang bảo lưu
  if (restrictedStatus === 'on_leave') {
    return (
      <div className="dashboard">
        <h1>Dashboard Học sinh</h1>
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          marginTop: '40px'
        }}>
          <h2 style={{ color: '#856404', marginTop: 0 }}>
            ⚠️ Bạn đang trong thời gian bảo lưu
          </h2>
          <p style={{ color: '#856404', fontSize: '16px', marginBottom: '24px' }}>
            Bạn không thể truy cập các lớp học và bài tập trong thời gian bảo lưu.
            <br />
            Vui lòng xem trạng thái đơn bảo lưu của bạn để biết thêm chi tiết.
          </p>
          <Link 
            to="/leave/status" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#ffc107',
              color: '#000',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: '500',
              fontSize: '16px'
            }}
          >
            Xem trạng thái đơn bảo lưu
          </Link>
        </div>
      </div>
    );
  }
  
  if (!data) return <div>Đang tải...</div>;
  return (
    <div className="dashboard">
      <h1>Dashboard Học sinh</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-num">{data.gpa}</span>
          <span>GPA</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{data.totalClasses}</span>
          <span>Lớp học</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{data.attendRate}%</span>
          <span>Điểm danh</span>
        </div>
      </div>
      {data.upcomingAssignments?.length > 0 && (
        <div className="table-box">
          <h3>Bài tập sắp đến hạn</h3>
          <table>
            <thead><tr><th>Bài tập</th><th>Hạn nộp</th></tr></thead>
            <tbody>
              {data.upcomingAssignments.map((a, i) => (
                <tr key={i}>
                  <td>{a.title}</td>
                  <td>{new Date(a.deadline).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
