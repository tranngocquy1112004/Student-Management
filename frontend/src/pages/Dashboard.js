import React, { useEffect, useState } from 'react';
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
  
  useEffect(() => { 
    api.get('/dashboard/teacher').then(({ data: res }) => {
      setData(res.data);
      setGradeData(res.data.gradeDistribution || { gioi: 0, kha: 0, trungBinh: 0, yeu: 0 });
      setAttendanceRate(res.data.attendRate || 0);
    }); 
  }, []);
  
  if (!data) return <div>Đang tải...</div>;
  return (
    <div className="dashboard">
      <h1>Dashboard Giảng viên</h1>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-num">{data.totalClasses}</span><span>Lớp dạy</span></div>
        <div className="stat-card"><span className="stat-num">{data.totalStudents}</span><span>Sinh viên</span></div>
        <div className="stat-card"><span className="stat-num">{data.assignmentsGraded}</span><span>Đã chấm</span></div>
        <div className="stat-card"><span className="stat-num">{data.assignmentsPending}</span><span>Chưa chấm</span></div>
        <div className="stat-card"><span className="stat-num">{data.attendRate}%</span><span>Tỷ lệ điểm danh</span></div>
      </div>
      
      {/* Attendance Rate Chart */}
      <AttendanceRateChart />
      
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
  useEffect(() => { api.get('/dashboard/student').then(({ data: res }) => setData(res.data)); }, []);
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
